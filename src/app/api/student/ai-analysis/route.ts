import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { aiAnalysisSchema } from '@/lib/api/schemas/naesin';
import { checkPlanGate } from '@/lib/billing/check-plan-api';
import { requireAcademyScope } from '@/lib/api/require-academy-scope';
import { logger } from '@/lib/logger';

const anthropic = new Anthropic();

// ── POST: AI 분석 생성 (teacher/admin/boss만) ──

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: aiAnalysisSchema, rateLimit: { max: 10 } },
  async ({ user, body, supabase }) => {
    const { studentId } = body;

    // 학원 범위 체크
    await requireAcademyScope(user, studentId, supabase);

    // Pro 전용 (boss 제외)
    if (user.role !== 'boss') {
      const blocked = await checkPlanGate(user.academy_id, 'reports');
      if (blocked) return blocked;
    }

    const admin = createAdminClient();

    // 데이터 수집
    const [progressRes, wrongRes, attemptsRes, dailyLogRes, unitsRes] = await Promise.all([
      admin
        .from('naesin_student_progress')
        .select('unit_id, vocab_completed, vocab_quiz_score, vocab_spelling_score, passage_completed, passage_fill_blanks_best, passage_ordering_best, passage_translation_best, grammar_completed, problem_completed, updated_at')
        .eq('student_id', studentId),
      admin
        .from('naesin_wrong_answers')
        .select('stage, source_type, question_data, resolved, unit_id')
        .eq('student_id', studentId)
        .eq('resolved', false)
        .limit(100),
      admin
        .from('naesin_problem_attempts')
        .select('score, total_questions, created_at, unit_id')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(30),
      admin
        .from('learning_daily_log')
        .select('log_date, total_seconds')
        .eq('student_id', studentId)
        .order('log_date', { ascending: false })
        .limit(14),
      admin
        .from('naesin_units')
        .select('id, unit_number, title'),
    ]);

    const progress = progressRes.data || [];
    const wrongAnswers = wrongRes.data || [];
    const attempts = attemptsRes.data || [];
    const dailyLog = dailyLogRes.data || [];
    const units = unitsRes.data || [];

    // 단원 ID → 이름 매핑
    const unitMap = new Map(units.map((u) => [u.id, `${u.unit_number}단원 ${u.title}`]));

    // 데이터 요약 텍스트 생성
    const progressSummary = progress.map((p) => {
      const name = unitMap.get(p.unit_id) || p.unit_id;
      const parts: string[] = [];
      if (p.vocab_completed) parts.push(`어휘완료(퀴즈${p.vocab_quiz_score ?? '-'}점)`);
      if (p.passage_completed) {
        parts.push(`지문완료(빈칸${p.passage_fill_blanks_best ?? '-'} 순서${p.passage_ordering_best ?? '-'} 영작${p.passage_translation_best ?? '-'})`);
      }
      if (p.grammar_completed) parts.push('문법완료');
      if (p.problem_completed) parts.push('문제완료');
      if (parts.length === 0) parts.push('미시작');
      return `- ${name}: ${parts.join(', ')}`;
    }).join('\n');

    const wrongSummary = wrongAnswers.slice(0, 30).map((w) => {
      const name = unitMap.get(w.unit_id) || '';
      const qd = w.question_data as Record<string, unknown>;
      const question = qd?.question || qd?.front_text || '';
      return `- [${w.stage}/${w.source_type}] ${name}: ${String(question).slice(0, 80)}`;
    }).join('\n');

    const attemptsSummary = attempts.map((a) => {
      const name = unitMap.get(a.unit_id) || '';
      const pct = a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0;
      return `- ${name}: ${a.score}/${a.total_questions} (${pct}%) [${a.created_at}]`;
    }).join('\n');

    const totalStudyMinutes = dailyLog.reduce((sum, d) => sum + (d.total_seconds || 0), 0) / 60;
    const studyDays = dailyLog.filter((d) => (d.total_seconds || 0) > 0).length;

    const prompt = `당신은 한국 중학생 영어 학습 분석 전문가입니다. 아래 학생의 학습 데이터를 분석하고 JSON으로 응답해주세요.

## 단원별 진도
${progressSummary || '(데이터 없음)'}

## 미해결 오답 (최대 30개)
${wrongSummary || '(오답 없음)'}

## 최근 문제풀이 시도
${attemptsSummary || '(시도 없음)'}

## 최근 2주 학습 습관
- 총 학습 시간: ${Math.round(totalStudyMinutes)}분
- 학습한 날: ${studyDays}일/14일

다음 JSON 형식으로 응답해주세요:
{
  "weaknesses": ["약점1", "약점2", ...],
  "unitSummary": [{"unit": "단원명", "score": 0~100, "status": "상태설명"}],
  "studyHabit": "학습 습관 한 줄 분석",
  "recommendations": ["추천1", "추천2", ...]
}

규칙:
- weaknesses는 최대 5개, 구체적으로 (예: "관계대명사 which/that 구분이 약함")
- unitSummary의 score는 진도+점수 종합 추정치
- recommendations는 최대 4개, 실행 가능한 조언
- 한국어로 작성
- JSON만 출력`;

    const aiResponse = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = aiResponse.content[0].type === 'text' ? aiResponse.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('ai_analysis.parse_failed', { studentId, response: responseText.slice(0, 200) });
      return NextResponse.json({ error: 'AI 응답을 파싱할 수 없습니다.' }, { status: 500 });
    }

    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(jsonMatch[0]);
    } catch {
      logger.error('ai_analysis.json_invalid', { studentId, raw: jsonMatch[0].slice(0, 200) });
      return NextResponse.json({ error: 'AI 응답 JSON이 올바르지 않습니다.' }, { status: 500 });
    }

    // DB 저장
    const { data: row, error: insertErr } = await admin
      .from('naesin_ai_analyses')
      .insert({ student_id: studentId, generated_by: user.id, analysis })
      .select('id, analysis, created_at')
      .single();

    if (insertErr) {
      logger.error('ai_analysis.insert_failed', { studentId, error: insertErr.message });
      return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json(row);
  },
);

// ── GET: 최신 AI 분석 조회 ──

export const GET = createApiHandler(
  { hasBody: false },
  async ({ user, supabase, request }) => {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const token = searchParams.get('token');

    let targetStudentId = studentId;

    // 학부모 토큰 접근
    if (token) {
      const admin = createAdminClient();
      const { data: tokenRow } = await admin
        .from('parent_share_tokens')
        .select('student_id')
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (!tokenRow) {
        return NextResponse.json({ error: '유효하지 않은 토큰입니다.' }, { status: 403 });
      }
      targetStudentId = tokenRow.student_id;
    } else if (user.role === 'student') {
      // 학생 본인
      targetStudentId = user.id;
    } else if (targetStudentId) {
      // teacher/admin/boss — 학원 범위 체크
      await requireAcademyScope(user, targetStudentId, supabase);
    } else {
      return NextResponse.json({ error: 'studentId가 필요합니다.' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from('naesin_ai_analyses')
      .select('id, analysis, created_at, generated_by')
      .eq('student_id', targetStudentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json(data || null);
  },
);
