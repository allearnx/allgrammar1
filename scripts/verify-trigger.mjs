import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1. 이전 테스트 유저 잔여 확인 및 삭제
const { data: allAuth } = await sb.auth.admin.listUsers();
const stale = allAuth.users.find(u => u.email.includes('test-trigger'));
if (stale) {
  await sb.from('users').delete().eq('id', stale.id);
  await sb.auth.admin.deleteUser(stale.id);
  console.log('잔여 테스트 유저 삭제:', stale.email);
}

// 2. 고유 이메일로 새 테스트
const testEmail = `trigger-test-${Date.now()}@test.com`;
console.log('\n=== 트리거 테스트:', testEmail);

const { data: newUser, error: createErr } = await sb.auth.admin.createUser({
  email: testEmail,
  password: 'test123456',
  email_confirm: true,
  user_metadata: { name: '트리거테스트', phone: '01099998888' },
});

if (createErr) {
  console.log('생성 실패:', createErr.message);
  console.log('상세:', JSON.stringify(createErr, null, 2));
  process.exit(1);
}

console.log('auth.users 생성 성공:', newUser.user.id);
await new Promise(r => setTimeout(r, 1500));

const { data: profile, error: profileErr } = await sb.from('users')
  .select('*')
  .eq('id', newUser.user.id)
  .maybeSingle();

if (profileErr || profile === null) {
  console.log('트리거 실패! public.users에 행 없음');
  if (profileErr) console.log('에러:', profileErr.message);
} else {
  console.log('트리거 성공!');
  console.log('  full_name:', profile.full_name, '(expected: 트리거테스트)');
  console.log('  role:', profile.role, '(expected: student)');
  console.log('  phone:', profile.phone, '(expected: 01099998888)');
}

// 정리
await sb.from('users').delete().eq('id', newUser.user.id);
await sb.auth.admin.deleteUser(newUser.user.id);
console.log('\n테스트 유저 삭제 완료');
