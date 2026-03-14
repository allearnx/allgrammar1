/**
 * 학생 리포트 시스템 E2E 테스트
 * - 리포트 API 데이터 조회
 * - 학부모 토큰 생성/조회/비활성화
 * - 학부모 토큰으로 리포트 API 접근
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const STUDENT_ID = '819b5a28-556f-41ba-9fdc-d6c0b3096f73';
const TEACHER_ID = '822a5496-e806-403a-a1fe-13c33dcec797';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}`);
    failed++;
  }
}

async function testReportAPI() {
  console.log('\n📊 1. 리포트 API 테스트 (localhost:3000)');

  // Test without auth → 401
  const res1 = await fetch('http://localhost:3000/api/student/my-report');
  assert(res1.status === 401, `인증 없이 → ${res1.status} (expect 401)`);

  // Test with invalid token → 404
  const res2 = await fetch('http://localhost:3000/api/student/my-report?token=invalid');
  assert(res2.status === 404, `잘못된 토큰 → ${res2.status} (expect 404)`);
}

async function testParentShareTokens() {
  console.log('\n🔗 2. 학부모 토큰 관리 테스트 (DB 직접)');

  // Clean up any existing tokens
  await admin.from('parent_share_tokens').delete().eq('student_id', STUDENT_ID);

  // Create token
  const { data: created, error: createErr } = await admin
    .from('parent_share_tokens')
    .insert({ student_id: STUDENT_ID, created_by: TEACHER_ID })
    .select('id, token, is_active')
    .single();

  assert(!createErr && created, `토큰 생성: ${createErr?.message || 'OK'}`);
  assert(created?.token?.length > 10, `토큰 길이: ${created?.token?.length}자`);
  assert(created?.is_active === true, `활성 상태: ${created?.is_active}`);

  const token = created?.token;

  // Read back by token
  const { data: found } = await admin
    .from('parent_share_tokens')
    .select('student_id')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  assert(found?.student_id === STUDENT_ID, `토큰으로 학생 조회: ${found?.student_id === STUDENT_ID}`);

  // Test report API with valid token
  console.log('\n📱 3. 토큰으로 리포트 API 접근 테스트');
  const res = await fetch(`http://localhost:3000/api/student/my-report?token=${token}`);
  assert(res.status === 200, `유효 토큰으로 API 접근 → ${res.status} (expect 200)`);

  if (res.status === 200) {
    const data = await res.json();

    // Validate response structure
    assert(Array.isArray(data.current?.services), `services 배열 존재`);
    assert(data.current?.services?.includes('voca'), `voca 서비스 포함`);
    assert(data.current?.services?.includes('naesin'), `naesin 서비스 포함`);
    assert(typeof data.current?.weaknesses === 'object', `weaknesses 존재`);
    assert(typeof data.current?.recommendations === 'object', `recommendations 존재`);

    // Trends
    assert(Array.isArray(data.trends?.vocaQuizScores), `vocaQuizScores 배열 존재`);
    assert(Array.isArray(data.trends?.naesinProblemScores), `naesinProblemScores 배열 존재`);
    assert(Array.isArray(data.trends?.naesinVocabScores), `naesinVocabScores 배열 존재`);

    // Wrong analysis
    assert(Array.isArray(data.wrongAnalysis?.vocaTopWrong), `vocaTopWrong 배열 존재`);
    assert(Array.isArray(data.wrongAnalysis?.naesinWrongByStage), `naesinWrongByStage 배열 존재`);
    assert(Array.isArray(data.wrongAnalysis?.naesinWrongByUnit), `naesinWrongByUnit 배열 존재`);

    // Unit breakdown
    assert(Array.isArray(data.unitBreakdown?.vocaDays), `vocaDays 배열 존재`);
    assert(Array.isArray(data.unitBreakdown?.naesinUnits), `naesinUnits 배열 존재`);

    // Activity log
    assert(Array.isArray(data.activityLog), `activityLog 배열 존재`);

    // Naesin stats
    if (data.current?.naesin) {
      const n = data.current.naesin;
      assert(typeof n.unitsInProgress === 'number', `naesin.unitsInProgress: ${n.unitsInProgress}`);
      assert(typeof n.totalUnits === 'number', `naesin.totalUnits: ${n.totalUnits}`);
      assert(typeof n.unresolvedWrongAnswers === 'number', `naesin.unresolvedWrongAnswers: ${n.unresolvedWrongAnswers}`);
    }

    // Voca stats
    if (data.current?.voca) {
      const v = data.current.voca;
      assert(typeof v.daysInProgress === 'number', `voca.daysInProgress: ${v.daysInProgress}`);
      assert(typeof v.totalDays === 'number', `voca.totalDays: ${v.totalDays}`);
    }

    // Print summary data
    console.log('\n  📈 데이터 요약:');
    console.log(`    보카 퀴즈 추이: ${data.trends.vocaQuizScores.length}건`);
    console.log(`    내신 문제 추이: ${data.trends.naesinProblemScores.length}건`);
    console.log(`    보카 Day 분석: ${data.unitBreakdown.vocaDays.length}개`);
    console.log(`    내신 Unit 분석: ${data.unitBreakdown.naesinUnits.length}개`);
    console.log(`    오답 단어 TOP: ${data.wrongAnalysis.vocaTopWrong.length}개`);
    console.log(`    활동 기록: ${data.activityLog.length}건`);
    console.log(`    약점: ${data.current.weaknesses.length}개`);
    console.log(`    추천: ${data.current.recommendations.length}개`);
  }

  // Deactivate token
  console.log('\n🔒 4. 토큰 비활성화 테스트');
  await admin
    .from('parent_share_tokens')
    .update({ is_active: false })
    .eq('token', token);

  const res2 = await fetch(`http://localhost:3000/api/student/my-report?token=${token}`);
  assert(res2.status === 404, `비활성화 후 API 접근 → ${res2.status} (expect 404)`);

  // Test parent page with deactivated token
  const res3 = await fetch(`http://localhost:3000/parent/${token}`);
  const html = await res3.text();
  assert(html.includes('만료'), `비활성 토큰 → 만료 메시지 표시`);

  // Clean up
  await admin.from('parent_share_tokens').delete().eq('student_id', STUDENT_ID);
}

async function testParentShareAPI() {
  console.log('\n🌐 5. 학부모 공유 API 테스트 (localhost:3000)');

  // Without auth → 403
  const res1 = await fetch('http://localhost:3000/api/parent-share?studentId=test');
  assert(res1.status === 403, `인증 없이 GET → ${res1.status} (expect 403)`);

  const res2 = await fetch('http://localhost:3000/api/parent-share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: 'test' }),
  });
  assert(res2.status === 403, `인증 없이 POST → ${res2.status} (expect 403)`);

  const res3 = await fetch('http://localhost:3000/api/parent-share', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: 'test' }),
  });
  assert(res3.status === 403, `인증 없이 DELETE → ${res3.status} (expect 403)`);
}

async function testParentPage() {
  console.log('\n📄 6. 학부모 공개 페이지 테스트');

  // Invalid token
  const res1 = await fetch('http://localhost:3000/parent/totally-invalid');
  assert(res1.status === 200, `잘못된 토큰 페이지 → ${res1.status} (expect 200)`);
  const html1 = await res1.text();
  assert(html1.includes('만료'), `만료 메시지 포함`);
  assert(html1.includes('올라영'), `브랜드 헤더 포함`);

  // Create a valid token and test
  const { data: t } = await admin
    .from('parent_share_tokens')
    .insert({ student_id: STUDENT_ID, created_by: TEACHER_ID })
    .select('token')
    .single();

  if (t?.token) {
    const res2 = await fetch(`http://localhost:3000/parent/${t.token}`);
    assert(res2.status === 200, `유효 토큰 페이지 → ${res2.status} (expect 200)`);
    const html2 = await res2.text();
    assert(html2.includes('이루이'), `학생 이름 표시`);
    assert(html2.includes('올라영'), `브랜드 헤더 표시`);
    assert(!html2.includes('만료'), `만료 메시지 없음`);

    // Cleanup
    await admin.from('parent_share_tokens').delete().eq('student_id', STUDENT_ID);
  }
}

async function testStudentPages() {
  console.log('\n📑 7. 학생 페이지 라우트 테스트');

  // Student report page (should redirect to login without auth)
  const res1 = await fetch('http://localhost:3000/student/my-report', { redirect: 'manual' });
  assert(res1.status === 307 || res1.status === 302, `학생 리포트 페이지 (미인증) → ${res1.status} (expect redirect)`);
}

// Run all tests
async function main() {
  console.log('🧪 학생 리포트 시스템 E2E 테스트 시작\n');

  await testReportAPI();
  await testParentShareTokens();
  await testParentShareAPI();
  await testParentPage();
  await testStudentPages();

  console.log(`\n${'='.repeat(40)}`);
  console.log(`✅ 통과: ${passed}  ❌ 실패: ${failed}  총: ${passed + failed}`);
  console.log(`${'='.repeat(40)}`);

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
