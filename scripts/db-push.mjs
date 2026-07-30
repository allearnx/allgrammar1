/**
 * Vercel 빌드 시 자동으로 supabase db push 실행
 * 필요한 Vercel 환경변수:
 *   SUPABASE_ACCESS_TOKEN - supabase login 토큰
 *   SUPABASE_PROJECT_ID   - 프로젝트 ref
 *   SUPABASE_DB_PASSWORD  - DB 비밀번호
 */
import { execSync } from 'child_process';

// 프리뷰 빌드는 프로덕션 DB에 마이그레이션을 밀면 안 됨 — 머지 전 브랜치의
// 마이그레이션이 실 DB에 먼저 적용되는 사고 방지 (프리뷰에도 환경변수가 등록됨, 2026-07-30)
if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
  console.log(`[db-push] VERCEL_ENV=${process.env.VERCEL_ENV} → 프리뷰/개발 빌드는 스킵`);
  process.exit(0);
}

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectId = process.env.SUPABASE_PROJECT_ID;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!token || !projectId || !dbPassword) {
  console.log('[db-push] 환경변수 미설정 → 스킵');
  process.exit(0);
}

// 최신 supabase CLI는 db push에 --project-ref 플래그가 없음 → link 후 --linked로 push
const opts = {
  stdio: 'inherit',
  env: { ...process.env, SUPABASE_ACCESS_TOKEN: token },
  timeout: 120_000,
};

try {
  console.log('[db-push] 프로젝트 링크 중...');
  execSync(
    `npx -y supabase link --project-ref "${projectId}" --password "${dbPassword}"`,
    opts,
  );
  console.log('[db-push] 마이그레이션 적용 중...');
  execSync(
    `npx -y supabase db push --linked --password "${dbPassword}" --yes`,
    opts,
  );
  console.log('[db-push] 완료');
} catch (err) {
  console.warn('[db-push] 실패 (빌드는 계속):', err.status);
  // 마이그레이션 실패해도 빌드는 진행 — 수동으로 확인 필요
}
