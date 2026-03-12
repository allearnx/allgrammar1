import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

function getAuthHeader() {
  const key = env.TOSS_PAYMENTS_SECRET_KEY;
  if (!key) throw new Error('TOSS_PAYMENTS_SECRET_KEY가 설정되지 않았습니다');
  return 'Basic ' + Buffer.from(key + ':').toString('base64');
}

async function tossRequest<T>(path: string, body: Record<string, unknown>, idempotencyKey?: string): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: getAuthHeader(),
    'Content-Type': 'application/json',
  };
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  const res = await fetch(`${TOSS_API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    logger.error('toss.api_error', { path, status: res.status, code: data.code, message: data.message });
    throw new TossPaymentError(data.code || 'UNKNOWN', data.message || '결제 처리 중 오류가 발생했습니다', res.status);
  }

  return data as T;
}

export class TossPaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'TossPaymentError';
  }
}

interface BillingKeyResponse {
  billingKey: string;
  customerKey: string;
  cardCompany: string;
  cardNumber: string;
}

export async function issueBillingKey(authKey: string, customerKey: string): Promise<BillingKeyResponse> {
  return tossRequest<BillingKeyResponse>('/billing/authorizations/issue', {
    authKey,
    customerKey,
  });
}

interface ChargeResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  receipt?: { url: string };
}

export async function chargeBilling(
  billingKey: string,
  params: {
    customerKey: string;
    amount: number;
    orderId: string;
    orderName: string;
  },
): Promise<ChargeResponse> {
  return tossRequest<ChargeResponse>(
    `/billing/${billingKey}`,
    {
      customerKey: params.customerKey,
      amount: params.amount,
      orderId: params.orderId,
      orderName: params.orderName,
    },
    params.orderId, // Idempotency-Key로 중복 결제 방지
  );
}
