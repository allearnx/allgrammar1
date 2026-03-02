import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'student';

  switch (role) {
    case 'manager':
      redirect('/manager');
    case 'admin':
      redirect('/admin');
    case 'super_admin':
      redirect('/super-admin');
    default:
      redirect('/student');
  }
}
