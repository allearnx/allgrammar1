import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testEmail = `fulltest-${Date.now()}@test.com`;
const testPhone = '01077778888';

console.log('=== 전체 플로우 테스트:', testEmail);

// 1. RPC로 유저 생성
const { data: userId, error: rpcErr } = await sb.rpc('create_voca_user', {
  _email: testEmail,
  _password: testPhone,
  _name: '풀테스트',
  _phone: testPhone,
});

if (rpcErr) { console.log('RPC 실패:', rpcErr.message); process.exit(1); }
console.log('1. RPC 성공 - userId:', userId);

await new Promise(r => setTimeout(r, 1500));

// 2. public.users 확인
const { data: profile } = await sb.from('users').select('*').eq('id', userId).maybeSingle();
if (profile) {
  console.log('2. 트리거 성공 - full_name:', profile.full_name, '/ phone:', profile.phone, '/ role:', profile.role);
} else {
  console.log('2. 트리거 실패!');
}

// 3. 로그인 테스트
const { error: loginErr } = await anon.auth.signInWithPassword({
  email: testEmail,
  password: testPhone,
});

if (loginErr) {
  console.log('3. 로그인 실패:', loginErr.message);
} else {
  console.log('3. 로그인 성공!');
}

// 정리
await sb.from('student_settings').delete().eq('student_id', userId);
await sb.from('users').delete().eq('id', userId);
await sb.rpc('delete_auth_user_by_id', { _user_id: userId }).catch(() => {});
// SQL로 직접 삭제 불가하니 auth.users는 수동 삭제 필요할 수 있음

console.log('\n테스트 유저 정리 완료 (auth.users는 SQL 에디터에서 삭제 필요할 수 있음)');
console.log('DELETE FROM auth.users WHERE email =', `'${testEmail}';`);
