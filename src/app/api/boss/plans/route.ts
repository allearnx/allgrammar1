import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { subscriptionPlanCreateSchema, subscriptionPlanPatchSchema } from '@/lib/api/schemas';

// 모든 요금제 조회
export const GET = createApiHandler(
  { hasBody: false },
  async ({ supabase }) => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('sort_order');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  },
);

// 요금제 생성 (boss only)
export const POST = createApiHandler(
  { roles: ['boss'], schema: subscriptionPlanCreateSchema },
  async ({ body, supabase }) => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .insert(body)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  },
);

// 요금제 수정 (boss only)
export const PATCH = createApiHandler(
  { roles: ['boss'], schema: subscriptionPlanPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;
    // Remove nullish values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined && v !== null),
    );

    const { data, error } = await supabase
      .from('subscription_plans')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  },
);
