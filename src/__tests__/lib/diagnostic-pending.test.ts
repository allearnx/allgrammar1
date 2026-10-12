import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PENDING_KEY, PENDING_TTL_MS, savePendingDiagnostic, attachPendingLeadId, takePendingDiagnostic,
  roundTransitionMessage, buildGateBody,
} from '@/app/(dashboard)/student/voca/diagnostic/_components/pending-diagnostic';

// node 환경용 localStorage mock
const store: Record<string, string> = {};
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v; }),
    removeItem: vi.fn((k: string) => { delete store[k]; }),
  },
  writable: true,
});

const rounds = [{ band: 'L2' as const, items: [{ token: 't1', chosenIndex: 0 }, { token: 't2', typed: null }] }];

beforeEach(() => { for (const k of Object.keys(store)) delete store[k]; });

describe('비로그인 완주분 보관함', () => {
  it('저장 → 꺼내기: 내용 그대로, 꺼낸 뒤에는 비어 있다', () => {
    savePendingDiagnostic('m1', rounds, 1000);
    const p = takePendingDiagnostic({ tookToday: false, now: 2000 });
    expect(p).toEqual({ grade: 'm1', rounds, at: 1000 });
    expect(takePendingDiagnostic({ tookToday: false, now: 2000 })).toBeNull();
    expect(store[PENDING_KEY]).toBeUndefined();
  });

  it('leadId를 덧붙이면 꺼낼 때 같이 나온다', () => {
    savePendingDiagnostic('m1', rounds, 1000);
    attachPendingLeadId('lead-9');
    expect(takePendingDiagnostic({ tookToday: false, now: 2000 })?.leadId).toBe('lead-9');
  });

  it('24시간 지난 보관분은 버린다', () => {
    savePendingDiagnostic('m1', rounds, 1000);
    expect(takePendingDiagnostic({ tookToday: false, now: 1000 + PENDING_TTL_MS + 1 })).toBeNull();
  });

  it('오늘 이미 진단했으면 버린다 (서버가 409만 돌려줌)', () => {
    savePendingDiagnostic('m1', rounds, 1000);
    expect(takePendingDiagnostic({ tookToday: true, now: 2000 })).toBeNull();
    expect(store[PENDING_KEY]).toBeUndefined(); // 버려도 지운다
  });

  it('손상된 payload·라운드 없음은 null', () => {
    store[PENDING_KEY] = '{not json';
    expect(takePendingDiagnostic({ tookToday: false })).toBeNull();
    store[PENDING_KEY] = JSON.stringify({ grade: 'm1', rounds: [], at: Date.now() });
    expect(takePendingDiagnostic({ tookToday: false })).toBeNull();
  });

  it('보관함이 비어 있으면 leadId 덧붙이기는 아무것도 안 한다', () => {
    attachPendingLeadId('lead-1');
    expect(store[PENDING_KEY]).toBeUndefined();
  });
});

describe('roundTransitionMessage', () => {
  it('같은 밴드 / 위 / 아래', () => {
    expect(roundTransitionMessage('L2', 'L2')).toContain('같은 레벨');
    expect(roundTransitionMessage('L2', 'L3')).toContain('어려운');
    expect(roundTransitionMessage('L2', 'L1')).toContain('쉬운');
  });
});

describe('buildGateBody', () => {
  it('익명 기록 id가 있으면 연결만, 없으면 라운드 답안을 다시 보낸다', () => {
    expect(buildGateBody({ leadId: 'lead-1', grade: 'm1', rounds, name: '김', phone: '010-1111-2222' }))
      .toEqual({ leadId: 'lead-1', name: '김', phone: '010-1111-2222' });
    expect(buildGateBody({ leadId: null, grade: 'm1', rounds, name: '김', phone: '010-1111-2222' }))
      .toEqual({ name: '김', phone: '010-1111-2222', grade: 'm1', rounds: [rounds[0].items] });
  });
});
