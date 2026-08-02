/**
 * 빌드 전 필수 환경변수 사전 검사.
 *
 * 배경: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY가 없으면 next build가
 * "Failed to collect page data for /callback" 같은 알아보기 힘든 에러로 죽는다
 * (env.ts의 clientEnv 검증이 페이지 데이터 수집 중 터짐). 프리뷰 환경변수 미설정
 * 삽질 방지용 — 무엇이 비었는지 로그 맨 끝에 한국어로 명확히 찍고 즉시 실패시킨다.
 *
 * CI 등에서 의도적으로 건너뛰려면 SKIP_ENV_VALIDATION=true.
 */
if (process.env.SKIP_ENV_VALIDATION === 'true') {
  console.log('[check-env] SKIP_ENV_VALIDATION=true → 건너뜀');
  process.exit(0);
}

const envName = process.env.VERCEL_ENV || '로컬';
const problems = [];

const REQUIRED = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
for (const key of REQUIRED) {
  const val = process.env[key];
  if (!val) {
    problems.push(`${key} — 값이 없습니다`);
  } else if (key === 'NEXT_PUBLIC_SUPABASE_URL') {
    try {
      new URL(val);
    } catch {
      problems.push(`${key} — 값이 URL 형식이 아닙니다 (현재 값 앞 20자: "${val.slice(0, 20)}...")`);
    }
  }
}

if (problems.length > 0) {
  console.error('');
  console.error('❌❌❌ [check-env] 빌드 중단 — 환경변수 문제 (' + envName + ' 환경) ❌❌❌');
  for (const p of problems) console.error('   • ' + p);
  console.error('');
  console.error('   해결: Vercel → Settings → Environment Variables에서 위 변수를 찾아');
  console.error(`   Environment 열에 "${envName}" 체크가 있는지 확인하세요.`);
  console.error('   변수를 고친 뒤에는 새로 배포해야 적용됩니다 (Redeploy).');
  console.error('');
  process.exit(1);
}

console.log(`[check-env] 필수 환경변수 OK (${envName} 환경)`);
