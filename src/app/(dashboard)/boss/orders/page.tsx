import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { OrdersClient } from './client';

export default async function BossOrdersPage() {
  const user = await requireUser();
  if (user.role !== 'boss') redirect('/login');

  const admin = createAdminClient();

  const { data: orders } = await admin
    .from('orders')
    .select('*, user:users(full_name, email, phone), course:courses(title)')
    .order('created_at', { ascending: false });

  return (
    <>
      <Topbar user={user} title="주문 관리" />
      <OrdersClient orders={orders || []} />
    </>
  );
}
