export type PlanTarget = 'academy' | 'individual';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
export type SubscriptionTier = 'free' | 'paid';
export type PaymentStatus = 'success' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled';

export interface SubscriptionPlan {
  id: string;
  name: string;
  target: PlanTarget;
  services: string[];
  price_per_unit: number;
  min_students: number | null;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  plan_id: string;
  academy_id: string | null;
  student_id: string | null;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  billing_key: string | null;
  customer_key: string;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  grace_period_end: string | null;
  failed_payment_count: number;
  canceled_at: string | null;
  created_by: string;
  created_at: string;
  // joined
  plan?: SubscriptionPlan;
}

export interface PaymentHistory {
  id: string;
  subscription_id: string;
  toss_payment_key: string | null;
  toss_order_id: string;
  amount: number;
  status: PaymentStatus;
  failure_code: string | null;
  failure_message: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_name: string;
  amount: number;
  status: OrderStatus;
  toss_order_id: string;
  toss_payment_key: string | null;
  receipt_url: string | null;
  failure_code: string | null;
  failure_message: string | null;
  paid_at: string | null;
  created_at: string;
}
