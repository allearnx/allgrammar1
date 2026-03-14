import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// RPC로 유저 생성 테스트
const testEmail = `rpc-test-${Date.now()}@test.com`;
console.log('=== RPC 테스트:', testEmail);

const { data: userId, error: rpcErr } = await sb.rpc('create_voca_user', {
  _email: testEmail,
  _password: '01012345678',
  _name: 'RPC테스트',
  _phone: '01012345678',
});

if (rpcErr) {
  console.log('RPC 실패:', rpcErr.message);
  process.exit(1);
}

console.log('RPC 성공! userId:', userId);

await new Promise(r => setTimeout(r, 1500));

const { data: profile } = await sb.from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle();

if (profile) {
  console.log('트리거도 성공!');
  console.log('  full_name:', profile.full_name);
  console.log('  role:', profile.role);
  console.log('  phone:', profile.phone);
} else {
  console.log('트리거 실패 — public.users에 행 없음');
}

// 정리
await sb.from('users').delete().eq('id', userId);
await sb.rpc('create_voca_user', { _email: 'cleanup', _password: 'x', _name: 'x', _phone: 'x' }).catch(() => {});
// auth.users에서도 삭제
const { data: delData } = await sb.auth.admin.deleteUser(userId).catch(() => ({ data: null }));
console.log('\n테스트 유저 삭제:', delData ? '완료' : 'auth 삭제 실패 (수동 삭제 필요)');
