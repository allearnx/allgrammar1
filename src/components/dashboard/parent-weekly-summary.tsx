import { createAdminClient } from '@/lib/supabase/admin';
import { CalendarCheck, Flame, Sparkles } from 'lucide-react';

/** KST 기준 오늘 날짜 문자열 (YYYY-MM-DD) */
function kstDateStr(d: Date): string {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 이번 주 월요일(KST) Date 문자열 */
function weekStartStr(): string {
  const nowKst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dow = nowKst.getUTCDay(); // KST 기준 요일 (0=일)
  const diff = dow === 0 ? 6 : dow - 1; // 월요일까지 거리
  nowKst.setUTCDate(nowKst.getUTCDate() - diff);
  return nowKst.toISOString().slice(0, 10);
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const PET_LABEL: Record<string, string> = {
  egg: '알', cracked: '금 간 알', chick: '병아리', chicken: '중간 닭', golden: '황금 닭',
};

/**
 * 학부모 리포트 상단 "이번 주" 요약 — 열 때마다 그 시점 최신 (크론 불필요).
 * 엄마가 매주 열 이유를 만드는 섹션: 며칠 했나 · 뭘 끝냈나 · 틀린 걸 극복했나.
 */
export async function ParentWeeklySummary({ studentId }: { studentId: string }) {
  const admin = createAdminClient();
  const weekStart = weekStartStr();
  const today = kstDateStr(new Date());

  const [logsRes, attemptsRes, wrongRes, petRes, recentLogsRes] = await Promise.all([
    admin
      .from('learning_daily_log')
      .select('date, seconds')
      .eq('student_id', studentId)
      .gte('date', weekStart),
    admin
      .from('voca_attempt_log')
      .select('step, score, created_at')
      .eq('student_id', studentId)
      .gte('created_at', `${weekStart}T00:00:00+09:00`),
    admin
      .from('voca_wrong_review')
      .select('total_words, graduated_count')
      .eq('student_id', studentId)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('student_pets')
      .select('stage')
      .eq('student_id', studentId)
      .maybeSingle(),
    // 스트릭 계산용 최근 60일 학습일
    admin
      .from('learning_daily_log')
      .select('date')
      .eq('student_id', studentId)
      .order('date', { ascending: false })
      .limit(60),
  ]);

  // 이번 주 학습일 + 총 시간
  const studiedDates = new Set<string>();
  let totalSeconds = 0;
  for (const row of logsRes.data ?? []) {
    studiedDates.add(row.date);
    totalSeconds += row.seconds ?? 0;
  }
  const totalMinutes = Math.round(totalSeconds / 60);

  // 이번 주 요일 칸 (월~일)
  const weekDays: { label: string; date: string; studied: boolean; isFuture: boolean }[] = [];
  const start = new Date(`${weekStart}T00:00:00+09:00`);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const ds = kstDateStr(d);
    weekDays.push({ label: DAY_LABELS[i], date: ds, studied: studiedDates.has(ds), isFuture: ds > today });
  }

  // 이번 주 시도·점수 (퀴즈+스펠링 평균)
  const attempts = attemptsRes.data ?? [];
  const scored = attempts.filter((a) => a.score != null);
  const avgScore = scored.length > 0
    ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length)
    : null;
  const stagesDone = attempts.length;

  // 오답 극복 (롤링 윈도우 최신 집계)
  const wrongTotal = wrongRes.data?.total_words ?? 0;
  const wrongGraduated = wrongRes.data?.graduated_count ?? 0;

  // 스트릭: 오늘(또는 어제)부터 연속 학습일
  const recentDates = [...new Set((recentLogsRes.data ?? []).map((r) => String(r.date)))].sort().reverse();
  let streak = 0;
  if (recentDates.length > 0) {
    // eslint-disable-next-line react-hooks/purity -- 서버 컴포넌트: 요청 시점 날짜 기준 스트릭 계산
    const yesterday = kstDateStr(new Date(Date.now() - 24 * 60 * 60 * 1000));
    let cursor = recentDates[0] === today ? today : recentDates[0] === yesterday ? yesterday : null;
    for (const d of recentDates) {
      if (d === cursor) {
        streak++;
        cursor = kstDateStr(new Date(new Date(`${d}T00:00:00+09:00`).getTime() - 15 * 60 * 60 * 1000));
      } else break;
    }
  }

  const petStage = petRes.data?.stage ? (PET_LABEL[petRes.data.stage] ?? null) : null;

  const [ws, we] = [weekDays[0].date, weekDays[6].date];
  const fmt = (s: string) => `${Number(s.slice(5, 7))}.${Number(s.slice(8, 10))}`;

  return (
    <div className="rounded-xl bg-white border shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-brand-500" />
        <span className="font-semibold text-gray-800">이번 주 학습</span>
        <span className="text-xs text-gray-400">{fmt(ws)} ~ {fmt(we)}</span>
        {streak > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
            <Flame className="h-3 w-3" /> {streak}일 연속
          </span>
        )}
      </div>

      {/* 요일 칸 */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((d) => (
          <div key={d.date} className="text-center">
            <div
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                d.studied
                  ? 'bg-[#E6F4EA] text-[#188038]'
                  : d.isFuture
                    ? 'bg-gray-50 text-gray-300'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {d.studied ? '✓' : d.label}
            </div>
            <p className="mt-1 text-[10px] text-gray-400">{d.label}</p>
          </div>
        ))}
      </div>

      {/* 요약 스탯 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-lg font-bold text-gray-800">{studiedDates.size}일</p>
          <p className="text-[11px] text-gray-500">학습한 날{totalMinutes > 0 ? ` · ${totalMinutes}분` : ''}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-lg font-bold text-gray-800">{stagesDone}개</p>
          <p className="text-[11px] text-gray-500">통과한 학습 단계</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-lg font-bold text-gray-800">{avgScore != null ? `${avgScore}점` : '—'}</p>
          <p className="text-[11px] text-gray-500">이번 주 평균 점수</p>
        </div>
      </div>

      {/* 오답 극복 + 펫 */}
      {(wrongTotal > 0 || petStage) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {wrongTotal > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FCE8E6] px-2.5 py-1 font-medium text-[#C5221F]">
              틀린 단어 {wrongTotal}개 중 <b>{wrongGraduated}개 극복</b> (3번 연속 정답 시 졸업)
            </span>
          )}
          {petStage && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
              <Sparkles className="h-3 w-3" /> 학습 펫: {petStage}
            </span>
          )}
        </div>
      )}

      {studiedDates.size === 0 && (
        <p className="text-xs text-gray-400 text-center">
          이번 주는 아직 학습 기록이 없어요. 이 페이지는 열 때마다 최신 현황으로 갱신됩니다.
        </p>
      )}
    </div>
  );
}
