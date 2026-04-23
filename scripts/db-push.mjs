/**
 * Vercel 빌드 시 자동으로 supabase db push 실행
 * 필요한 Vercel 환경변수:
 *   SUPABASE_ACCESS_TOKEN - supabase login 토큰
 *   SUPABASE_PROJECT_ID   - 프로젝트 ref
 *   SUPABASE_DB_PASSWORD  - DB 비밀번호
 */
import { execFileSync } from 'child_process';

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectId = process.env.SUPABASE_PROJECT_ID;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!token || !projectId || !dbPassword) {
  console.log('[db-push] SUPABASE_ACCESS_TOKEN / PROJECT_ID / DB_PASSWORD 미설정 → 스킵');
  process.exit(0);
}

try {
  console.log('[db-push] 마이그레이션 적용 중...');
  execFileSync('npx', [
    'supabase', 'db', 'push',
    '--project-ref', projectId,
    '--password', dbPassword,
    '--yes',
  ], {
    stdio: 'inherit',
    env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  });
  console.log('[db-push] 완료');
} catch (err) {
  console.error('[db-push] 마이그레이션 실패:', err.message?.split('\n')[0]);
  process.exit(1);
}
