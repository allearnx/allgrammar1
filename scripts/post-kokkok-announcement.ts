/**
 * 내신 콕콕 배정 공지 — 특정 학원 스태프에게 로그인 팝업(마이그레이션 113 배포 후 실행).
 *   npx tsx --env-file=.env.local scripts/post-kokkok-announcement.ts --academy <id> --title "..." --content "..." [--apply]
 */
import { createAdminClient } from '@/lib/supabase/admin';
const arg = (k: string) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : undefined; };
const APPLY = process.argv.includes('--apply');
async function main() {
  const admin = createAdminClient();
  const academy = arg('--academy')!; const title = arg('--title')!; const content = arg('--content')!;
  const { data: a } = await admin.from('academies').select('name').eq('id', academy).single();
  const { data: staff } = await admin.from('users').select('full_name, role').eq('academy_id', academy).in('role', ['teacher', 'admin']);
  console.log(`학원: ${a?.name} | 대상 스태프 ${staff?.length}명: ${staff?.map((s) => `${s.full_name}(${s.role})`).join(', ')}\n제목: ${title}\n본문:\n${content}`);
  if (!APPLY) { console.log('[dry-run]'); return; }
  const { data, error } = await admin.from('announcements').insert({
    title, content, type: 'important', target_roles: ['teacher', 'admin'], is_published: true, published_at: new Date().toISOString(), academy_id: academy, popup: true,
  }).select('id').single();
  if (error) throw error;
  console.log('✓ 공지 발행', data.id);
}
main().catch((e) => { console.error(e); process.exit(1); });
