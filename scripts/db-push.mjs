/**
 * Vercel 빌드 시 자동으로 supabase db push 실행
 * 필요한 Vercel 환경변수:
 *   SUPABASE_ACCESS_TOKEN - supabase login 토큰
 *   SUPABASE_PROJECT_ID   - 프로젝트 ref
 *   SUPABASE_DB_PASSWORD  - DB 비밀번호
 */
import { execSync } from 'child_process';

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectId = process.env.SUPABASE_PROJECT_ID;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!token || !projectId || !dbPassword) {
  console.log('[db-push] 환경변수 미설정 → 스킵');
  process.exit(0);
}

try {
  console.log('[db-push] 마이그레이션 적용 중...');
  execSync(
    `npx -y supabase db push --project-ref "${projectId}" --password "${dbPassword}" --yes`,
    {
      stdio: 'inherit',
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
      timeout: 120_000,
    }
  );
  console.log('[db-push] 완료');
} catch (err) {
  console.warn('[db-push] 실패 (빌드는 계속):', err.status);
  // 마이그레이션 실패해도 빌드는 진행 — 수동으로 확인 필요
}
