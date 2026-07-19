import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { testStudent } from '../helpers/fixtures';

/**
 * 결제 승인 멱등성 회귀 테스트 (2026-07-19 실사고).
 * 결제 완료 화면에서 다른 페이지로 갔다가 뒤로 가기 → 콜백 재진입 → 같은 주문 재승인
 * → orders UNIQUE(toss_order_id) 충돌 → "기록 실패" 오인 → 정상 결제 자동 취소.
 * 불변식: 이미 처리된 주문의 재진입은 성공 응답이어야 하고, cancelPayment는 절대 불리면 안 된다.
 */

const mockGetUser = vi.fn();
const mockCreateClient = vi.fn();
const mockConfirmPayment = vi.fn();
const mockCancelPayment = vi.fn();

vi.mock('@/lib/auth/helpers', () => ({
  getUser: (...args: unknown[]) => mockGetUser(...args),
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: vi.fn() })),
}));
vi.mock('@/lib/payments/toss', () => ({
  confirmPayment: (...args: unknown[]) => mockConfirmPayment(...args),
  cancelPayment: (...args: unknown[]) => mockCancelPayment(...args),
  TossPaymentError: class TossPaymentError extends Error {
    code = 'TEST';
    statusCode = 400;
  },
}));
vi.mock('@/lib/telegram', () => ({ sendTelegram: vi.fn() }));
vi.mock('@/lib/cache/invalidate', () => ({ invalidateStudentServices: vi.fn() }));
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: vi.fn(),
}));

/** select 체인은 returnThis, 종단(single/maybeSingle)은 값 반환, insert는 바로 await 가능 */
function table(opts: {
  maybeSingle?: unknown;
  single?: unknown;
  insertError?: unknown;
}) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: opts.maybeSingle ?? null, error: null }),
    single: vi.fn().mockResolvedValue({ data: opts.single ?? null, error: null }),
    insert: vi.fn().mockResolvedValue({ error: opts.insertError ?? null }),
    upsert: vi.fn().mockResolvedValue({ error: null }),
  };
  return chain;
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/payment/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
}

const VALID_BODY = {
  paymentKey: 'pay_key_1',
  orderId: 'order_123',
  amount: 19900,
  orderName: '올킬보카 셀프학습',
  courseId: 'a0484bdc-5ff9-4a13-858b-091e00d5fd16',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  mockGetUser.mockResolvedValue(testStudent);
});

describe('POST /api/payment/confirm — 멱등성', () => {
  it('이미 paid인 주문의 재진입 → 200 성공, 토스 재승인·취소 호출 없음', async () => {
    const tables: Record<string, ReturnType<typeof table>> = {
      orders: table({ maybeSingle: { status: 'paid', receipt_url: 'https://r', course_id: VALID_BODY.courseId } }),
      courses: table({ single: { category: 'voca' } }),
      service_assignments: table({ maybeSingle: { id: 'assign-1' } }),
    };
    mockCreateClient.mockResolvedValue({ from: vi.fn((t: string) => tables[t]) });

    const { POST } = await import('@/app/api/payment/confirm/route');
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.receiptUrl).toBe('https://r');
    expect(json.serviceActivated).toBe('voca');
    expect(mockConfirmPayment).not.toHaveBeenCalled();
    expect(mockCancelPayment).not.toHaveBeenCalled();
  });

  it('주문 저장 중복 충돌(23505) → 200 성공, 결제 취소 호출 없음', async () => {
    const tables: Record<string, ReturnType<typeof table>> = {
      // 사전 체크는 미스(레이스), insert에서 중복 충돌
      orders: table({ maybeSingle: null, insertError: { code: '23505', message: 'duplicate key' } }),
      courses: table({ single: { category: 'voca' } }),
      service_assignments: table({ maybeSingle: null }),
    };
    mockCreateClient.mockResolvedValue({ from: vi.fn((t: string) => tables[t]) });
    mockConfirmPayment.mockResolvedValue({
      totalAmount: VALID_BODY.amount,
      paymentKey: VALID_BODY.paymentKey,
      receipt: { url: 'https://r2' },
    });

    const { POST } = await import('@/app/api/payment/confirm/route');
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(mockCancelPayment).not.toHaveBeenCalled();
  });

  it('정상 첫 승인 → 200 성공 + 서비스 활성화', async () => {
    const adminTables: Record<string, ReturnType<typeof table>> = {
      service_assignments: table({ maybeSingle: null }),
    };
    const { createAdminClient } = await import('@/lib/supabase/admin');
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn((t: string) => adminTables[t]),
    });

    const tables: Record<string, ReturnType<typeof table>> = {
      orders: table({ maybeSingle: null }),
      courses: table({ single: { category: 'voca', duration_days: 30 } }),
    };
    mockCreateClient.mockResolvedValue({ from: vi.fn((t: string) => tables[t]) });
    mockConfirmPayment.mockResolvedValue({
      totalAmount: VALID_BODY.amount,
      paymentKey: VALID_BODY.paymentKey,
      receipt: { url: 'https://r3' },
    });

    const { POST } = await import('@/app/api/payment/confirm/route');
    const res = await POST(makeRequest(VALID_BODY));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.serviceActivated).toBe('voca');
    expect(mockConfirmPayment).toHaveBeenCalledTimes(1);
    expect(mockCancelPayment).not.toHaveBeenCalled();
  });
});
