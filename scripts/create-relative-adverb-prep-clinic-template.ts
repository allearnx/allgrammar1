/**
 * "관계부사=전치사+관계대명사" 집중훈련 템플릿 신규 제작 (2026-09-17).
 * 계기: 김성율(중3 능률김 5과 관계부사 단원, 9/13~9/14 시도)이 이 전환 유형에서 반복 오답
 * (전치사+관계대명사 치환 10문항 중 6개 오답). 특정 교재에 종속되지 않는 재사용 템플릿으로
 * 독립 제작 — 관계부사(where/when/why/how)를 다루는 어느 단원에든 가져오기(import) 가능.
 *
 * 구성 (30문항, 인식→분석→구성 흐름):
 *   Part A (1~10, 단일 객관식): 관계부사 ↔ 전치사+관계대명사 상호 변환
 *   Part B (11~20, 단일/복수 객관식): 전치사 중복·위치 오류 판별 + 완전한 문장(전치사 필요) 여부 판단
 *   Part C (21~30, 서술형): 두 문장 연결·바꿔쓰기·오류 고치기·영작 (조건별 관계부사 vs 전치사+관계대명사)
 * 모든 문항에 해설 포함. 서술형은 acceptedAnswers + ※ 형식 안내, 복합 답안은 subParts.
 * 객관식 정답은 ①~⑤ 균등 분배(회전 배치).
 *
 *   npx tsx --env-file=.env.local scripts/create-relative-adverb-prep-clinic-template.ts [--apply]
 */
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions } from '@/lib/validation/problem-validator';
import { scanRow } from '@/lib/validation';
import type { NaesinProblemQuestion } from '@/types/naesin';

const APPLY = process.argv.includes('--apply');
const BOSS_ID = 'ae9f4803-16fe-40ae-b161-9603b4c86af4'; // 안홍미(boss)

type Sub = { label: string; answer: string; acceptedAnswers?: string[] };
type Draft = {
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  subParts?: Sub[];
  acceptedAnswers?: string[];
};

// ── Part A: 관계부사 ↔ 전치사+관계대명사 변환 (단일 객관식, 정답 텍스트로 표기) ──
const A: Draft[] = [
  {
    question: 'This is the hospital where my mother works.\n= This is the hospital __________ my mother works.',
    options: ['that', 'which', 'in which', 'when', 'what'],
    answer: 'in which',
    explanation: "관계부사 where는 '전치사+관계대명사'로 바꿀 수 있다. works(일하다)는 장소를 나타내는 전치사 in이 필요하므로 where = in which.",
  },
  {
    question: 'I still remember the day when we first met.\n= I still remember the day __________ we first met.',
    options: ['what', 'where', 'which', 'on which', 'that'],
    answer: 'on which',
    explanation: "시간을 나타내는 관계부사 when은 '전치사+관계대명사'로 바꿀 때 보통 on which(특정한 날)를 쓴다. when = on which.",
  },
  {
    question: 'Tell me the reason why you were late.\n= Tell me the reason __________ you were late.',
    options: ['which', 'what', 'for which', 'where', 'how'],
    answer: 'for which',
    explanation: "이유를 나타내는 관계부사 why는 '전치사+관계대명사'로 바꿀 때 for which를 쓴다. (이유 → be late FOR a reason)",
  },
  {
    question: 'This is how she fixed the machine.\n= This is __________ she fixed the machine.',
    options: ['the way in which', 'the way how', 'in which', 'for which', 'when'],
    answer: 'the way in which',
    explanation: '관계부사 how는 the way와 함께 쓸 수 없다(the way how ✕). how 대신 the way, the way that, the way in which로 바꿔 쓴다.',
  },
  {
    question: 'This is the town which I grew up in.\n= This is the town __________ I grew up.',
    options: ['which', 'where', 'that', 'why', 'how'],
    answer: 'where',
    explanation: '전치사(in)가 이미 관계대명사 뒤에 있던 문장을 관계부사로 바꾸면 전치사가 사라진다. 장소를 나타내므로 where.',
  },
  {
    question: 'December is the month when it snows a lot.\n= December is the month __________ it snows a lot.',
    options: ['which', 'why', 'in which', 'how', 'what'],
    answer: 'in which',
    explanation: "시간의 관계부사 when = 전치사+관계대명사로 바꾸면 in which(그 달 안에)가 자연스럽다.",
  },
  {
    question: 'She didn’t explain the reason why she quit her job.\n= She didn’t explain the reason __________ she quit her job.',
    options: ['where', 'which', 'when', 'for which', 'what'],
    answer: 'for which',
    explanation: '이유의 관계부사 why = for which.',
  },
  {
    question: 'This is the café that I met her in.\n= This is the café __________ I met her.',
    options: ['which', 'that', 'where', 'why', 'how'],
    answer: 'where',
    explanation: '전치사(in)가 딸려 있던 문장을 관계부사로 바꾸면 전치사는 사라지고 where만 남는다.',
  },
  {
    question: 'Spring is the season when flowers bloom.\n= Spring is the season __________ flowers bloom.',
    options: ['why', 'how', 'which', 'in which', 'that'],
    answer: 'in which',
    explanation: '시간의 관계부사 when = in which. bloom은 자동사지만 the season 자체가 시간의 배경이 되므로 in which로 자연스럽게 바꾼다.',
  },
  {
    question: 'I can’t find the reason for which he was upset.\n= I can’t find the reason __________ he was upset.',
    options: ['which', 'when', 'why', 'where', 'how'],
    answer: 'why',
    explanation: '전치사+관계대명사(for which)를 관계부사로 바꾸면 for가 사라지고 why만 남는다.',
  },
];

// ── Part B: 오류·정오 판단 ──
const B: Draft[] = [
  {
    question: '다음 중 어법상 어색한 것은?',
    options: [
      'This is the house where I was born.',
      'This is the house in which I was born.',
      'This is the house which I was born in.',
      'This is the house where I was born in.',
      'This is the house that I was born in.',
    ],
    answer: 'This is the house where I was born in.',
    explanation: '관계부사 where는 이미 전치사의 의미를 포함하므로, 뒤에 전치사(in)를 또 쓰면 중복 오류가 된다.',
  },
  {
    question: '다음 중 어법상 어색한 것은?',
    options: [
      'Tell me the reason why he left.',
      'Tell me the reason for which he left.',
      'Tell me the reason which he left for.',
      'Tell me the reason why he left for.',
      'Tell me the reason that he left for.',
    ],
    answer: 'Tell me the reason why he left for.',
    explanation: 'why도 전치사(for)의 의미를 포함하므로, 뒤에 for를 또 쓰면 중복 오류.',
  },
  {
    question: '다음 중 어법상 어색한 것은?',
    options: [
      'I remember the day when we met.',
      'I remember the day on which we met.',
      'I remember the day which we met on.',
      'I remember the day when we met on.',
      'I remember the day that we met on.',
    ],
    answer: 'I remember the day when we met on.',
    explanation: 'when 뒤에 전치사 on을 또 쓰면 중복 오류.',
  },
  {
    question: '다음 중 어법상 어색한 것은?',
    options: [
      'This is how she solved it.',
      'This is the way she solved it.',
      'This is the way in which she solved it.',
      'This is the way how she solved it.',
      'This is the way that she solved it.',
    ],
    answer: 'This is the way how she solved it.',
    explanation: 'the way와 how는 같이 쓸 수 없다. the way / the way that / the way in which / how 중 하나만 쓴다.',
  },
  {
    question: '다음 중 어법상 옳은 것은?',
    options: [
      'The café where I met her at was cozy.',
      'The café in that I met her was cozy.',
      'The café that I met her in was cozy.',
      'The café at that I met her was cozy.',
      'The café which I met her at in was cozy.',
    ],
    answer: 'The café that I met her in was cozy.',
    explanation: "that(또는 which)로 바꿀 때는 전치사를 문장 끝에 남긴다(that ... in). 전치사를 관계대명사 that 바로 앞에 쓸 수는 없다(in that ✕).",
  },
  {
    question: '다음 중 어법상 옳은 것은?',
    options: [
      'The reason how he apologized is unclear.',
      'The reason which he apologized is unclear.',
      'The reason for which he apologized is unclear.',
      'The reason where he apologized is unclear.',
      'The reason when he apologized is unclear.',
    ],
    answer: 'The reason for which he apologized is unclear.',
    explanation: "apologize for a reason이므로 이유를 나타낼 때는 for which(또는 why)를 쓴다.",
  },
  {
    question: '다음 밑줄 친 부분 중 어법상 어색한 것은?',
    options: [
      'This is the hotel <u>where</u> we stayed.',
      'This is the hotel <u>which</u> we stayed at.',
      'This is the hotel <u>at which</u> we stayed.',
      'This is the hotel <u>where</u> we stayed at.',
      'This is the hotel <u>that</u> we stayed at.',
    ],
    answer: 'This is the hotel <u>where</u> we stayed at.',
    explanation: 'where 뒤에 전치사 at을 또 쓰면 중복 오류. 나머지는 형태가 다르지만 모두 올바른 표현이다.',
  },
  {
    question: '다음 빈칸 ⓐ, ⓑ에 들어갈 말이 순서대로 바르게 짝지어진 것은?\n\n· This is the lab ⓐ__________ he works.\n· This is the lab ⓑ__________ he works in.',
    options: ['where - that', 'which - where', 'how - which', 'why - when', 'when - why'],
    answer: 'where - that',
    explanation: 'ⓐ는 뒤에 전치사가 없으므로 where(전치사 포함)가 필요하고, ⓑ는 뒤에 in이 이미 있으므로 that(전치사 없는 관계대명사)이 필요하다.',
  },
  {
    question: '다음 중 어법상 옳은 문장의 개수는?\n\nⓐ This is the museum where we visited.\nⓑ This is the museum which we visited.\nⓒ This is the museum in which we visited.\nⓓ This is the museum that we visited.\nⓔ This is the museum where we visited it.',
    options: ['None', 'One', 'Two', 'Three', 'Four'],
    answer: 'Two',
    explanation: "visit은 목적어를 바로 받는 타동사(visit + 목적어)라 전치사가 필요 없다. 따라서 where/in which(전치사 포함)를 쓰면 오히려 어색하고, which/that(전치사 없는 관계대명사)이 맞다. 옳은 문장은 ⓑ, ⓓ 2개.",
  },
  {
    question: '다음 중 어법상 옳은 문장을 모두 고르면? (정답 2개)',
    options: [
      'The town which I was born is quiet.',
      'The town where I was born in is quiet.',
      'The town in which I was born is quiet.',
      'The town that I was born in is quiet.',
      'The town how I was born is quiet.',
    ],
    answer: 'The town in which I was born is quiet., The town that I was born in is quiet.',
    explanation: "be born은 '~에서 태어나다'로 전치사 in이 필요한 동사다. ①은 전치사가 없어 불완전하고 ②는 where와 in이 중복, ⑤는 how가 어색하다. ③(in which)과 ④(that ... in)만 올바르다.",
  },
];

// ── Part C: 서술형 (두 문장 연결 / 바꿔쓰기 / 오류 고치기 / 영작) ──
const C: Draft[] = [
  {
    question: '다음 두 문장을 관계부사를 사용하여 한 문장으로 쓰시오.\n\n• This is the restaurant.\n• We had dinner there last night.',
    answer: 'This is the restaurant where we had dinner last night.',
    acceptedAnswers: [],
    explanation: '장소를 나타내는 there → 관계부사 where로 바꿔 두 문장을 연결한다.',
  },
  {
    question: '다음 두 문장을 <조건>에 맞게 한 문장으로 쓰시오.\n\n• This is the restaurant.\n• We had dinner there last night.\n\n<조건> in which를 반드시 사용할 것',
    answer: 'This is the restaurant in which we had dinner last night.',
    acceptedAnswers: [],
    explanation: 'in which는 관계부사 where와 같은 뜻이지만, 조건이 있으므로 반드시 in which 형태로 써야 한다.',
  },
  {
    question: '다음 문장을 <보기>와 같이 "관계대명사(that)+전치사" 형태로 바꿔 쓰시오.\n\n<보기> This is the town where I was born.\n→ This is the town that I was born in.\n\nThis is the library where I do my homework.',
    answer: 'This is the library that I do my homework in.',
    acceptedAnswers: ['This is the library which I do my homework in.'],
    explanation: '관계부사 where를 관계대명사 that(또는 which)로 바꾸면, where가 품고 있던 전치사 in을 문장 끝에 남겨야 한다.',
  },
  {
    question: '다음 두 문장을 관계부사 when을 사용하여 한 문장으로 쓰시오.\n\n• I’ll never forget the day.\n• I graduated from middle school on that day.',
    answer: "I'll never forget the day when I graduated from middle school.",
    acceptedAnswers: [],
    explanation: 'on that day → 관계부사 when으로 바꿔 두 문장을 연결한다.',
  },
  {
    question: '다음 두 문장을 <조건>에 맞게 한 문장으로 쓰시오.\n\n• I’ll never forget the day.\n• I graduated from middle school on that day.\n\n<조건> on which를 반드시 사용할 것',
    answer: "I'll never forget the day on which I graduated from middle school.",
    acceptedAnswers: [],
    explanation: 'on which는 when과 같은 뜻이지만, 조건에 따라 on which 형태로 써야 한다.',
  },
  {
    question: '다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nThis is the hotel where we stayed at during the trip.',
    answer: 'where we stayed at → where we stayed',
    acceptedAnswers: [
      'This is the hotel where we stayed during the trip.',
      'This is the hotel that we stayed at during the trip.',
      'This is the hotel which we stayed at during the trip.',
      'stayed at → stayed',
    ],
    explanation: "where가 이미 '그 호텔에서'라는 뜻을 포함하므로, stay at의 at을 또 쓰면 전치사가 중복된다. at을 지우거나, where 대신 that/which를 쓰고 at을 살려야 한다. (※ 정답은 '고친 형태'만 자동 저장됨 — where we stayed)",
  },
  {
    question: '다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오.\n\nTell me the reason why he apologized for.',
    answer: 'why he apologized for → why he apologized',
    acceptedAnswers: [
      'Tell me the reason why he apologized.',
      'Tell me the reason for which he apologized.',
      'apologized for → apologized',
    ],
    explanation: "why가 이미 '그 이유로'라는 뜻을 포함하므로, apologize for의 for를 또 쓰면 전치사가 중복된다. (※ 정답은 '고친 형태'만 자동 저장됨 — why he apologized)",
  },
  {
    question: '다음 우리말과 일치하도록 주어진 단어를 배열하여 영작하시오.\n\n이것은 내가 태어난 마을이다.\n(town, where, born, was, I, this, the, is)',
    answer: 'This is the town where I was born.',
    acceptedAnswers: [],
    explanation: '관계부사 where를 사용해 선행사(the town)를 수식하는 문장을 만든다.',
  },
  {
    question: '다음 우리말과 일치하도록 주어진 단어를 배열하여 영작하시오. (전치사+관계대명사를 사용할 것)\n\n이것은 내가 태어난 마을이다.\n(town, in, which, born, was, I, this, the, is)',
    answer: 'This is the town in which I was born.',
    acceptedAnswers: [],
    explanation: '관계부사 where 대신 전치사+관계대명사 in which를 사용해 같은 뜻의 문장을 만든다.',
  },
  {
    question: '다음 두 문장을 <조건>에 맞게 각각 완성하시오.\n\n• She didn’t tell me the reason.\n• She was upset for that reason.\n\n(1) 관계부사를 사용하여 쓸 것\n(2) 전치사+관계대명사를 사용하여 쓸 것\n\n※ 두 문장 모두 완전한 문장으로 쓸 것',
    answer: 'She didn’t tell me the reason why she was upset. / She didn’t tell me the reason for which she was upset.',
    subParts: [
      { label: '(1)', answer: "She didn't tell me the reason why she was upset." },
      { label: '(2)', answer: "She didn't tell me the reason for which she was upset." },
    ],
    explanation: 'for that reason → 관계부사 why 또는 전치사+관계대명사 for which로 바꿔 연결한다.',
  },
];

// ── 타입/태그 부여 + 균등 배치 + 번호 매기기 ──
function buildQuestions(): NaesinProblemQuestion[] {
  const qs: NaesinProblemQuestion[] = [];
  let n = 1;

  // Part A + B의 단일 정답 객관식 19개를 모아 ①~⑤ 위치를 순환 배치
  const singleChoiceDrafts = [...A, ...B].filter((d) => !d.answer.includes(','));
  const multiOrSpecial = [...A, ...B].filter((d) => d.answer.includes(','));
  let posCursor = 0;
  const positioned = new Map<Draft, number>();
  for (const d of [...A, ...B]) {
    if (d.answer.includes(',')) continue;
    positioned.set(d, (posCursor % 5) + 1);
    posCursor++;
  }

  for (const d of A) {
    const opts = d.options!;
    const others = opts.filter((o) => o !== d.answer);
    const pos = positioned.get(d)!;
    const finalOpts = [...others];
    finalOpts.splice(pos - 1, 0, d.answer);
    qs.push({
      number: n++,
      tag: '단일',
      type: 'single_choice',
      question: d.question,
      options: finalOpts,
      answer: String(pos),
      explanation: d.explanation,
    } as NaesinProblemQuestion);
  }
  for (const d of B) {
    const opts = d.options!;
    const isMulti = d.answer.split(', ').length > 1 && d.answer.split(', ').every((v) => opts.includes(v));
    if (isMulti) {
      // 정답 값(문장) 각각의 옵션 내 위치(1-indexed)를 구해 "3, 4" 형태로 저장 — 옵션 순서는 그대로 유지
      const positions = d.answer.split(', ').map((v) => opts.indexOf(v) + 1);
      if (positions.some((p) => p === 0)) throw new Error(`정답 매칭 실패: ${d.answer}`);
      qs.push({
        number: n++,
        tag: '복수',
        type: 'multi_choice',
        question: d.question,
        options: opts,
        answer: positions.join(', '),
        explanation: d.explanation,
      } as NaesinProblemQuestion);
      continue;
    }
    const pos = positioned.get(d)!;
    const others = opts.filter((o) => o !== d.answer);
    const finalOpts = [...others];
    finalOpts.splice(pos - 1, 0, d.answer);
    qs.push({
      number: n++, tag: '단일', type: 'single_choice',
      question: d.question, options: finalOpts, answer: String(pos),
      explanation: d.explanation,
    } as NaesinProblemQuestion);
  }
  for (const d of C) {
    qs.push({
      number: n++,
      tag: d.subParts ? '복합' : '서술형',
      type: d.subParts ? 'multi_part' : 'sentence',
      question: d.question,
      answer: d.answer,
      ...(d.acceptedAnswers?.length ? { acceptedAnswers: d.acceptedAnswers } : {}),
      ...(d.subParts ? { subParts: d.subParts } : {}),
      explanation: d.explanation,
    } as NaesinProblemQuestion);
  }
  return qs;
}

async function main() {
  const questions = buildQuestions();
  const answerKeyRaw = questions.map((q) => q.answer as string);

  // 정답 위치 분포 확인 (①~⑤ 균등 여부)
  const dist: Record<string, number> = {};
  for (const q of questions) {
    if (q.options?.length && !String(q.answer).includes(',')) {
      dist[String(q.answer)] = (dist[String(q.answer)] ?? 0) + 1;
    }
  }
  console.log('MCQ 정답 위치 분포:', JSON.stringify(dist));

  const { questions: sanitized, answerKey } = sanitizeQuestions(questions, answerKeyRaw, { title: '관계부사=전치사+관계대명사 집중훈련' });
  const issues = scanRow('template', { id: '', title: '관계부사=전치사+관계대명사 집중훈련', questions: sanitized, answer_key: answerKey })
    .filter((i) => i.category === 'correctness');
  console.log(`\n검증: 문항 ${sanitized.length}개, correctness 이슈 ${issues.length}건`);
  for (const iss of issues) console.log('  ⚠', JSON.stringify(iss));

  console.log('\n--- 문항 미리보기 (1, 11, 21, 30) ---');
  for (const n of Array.from({ length: 30 }, (_, i) => i + 1)) {
    const q = sanitized.find((x) => x.number === n);
    console.log(JSON.stringify(q, null, 1));
  }

  if (!APPLY) { console.log('\n[dry-run] --apply 로 생성'); return; }
  if (issues.length > 0) { console.error('correctness 이슈가 있어 생성 중단'); process.exit(1); }

  const admin = createAdminClient();
  const { data, error } = await admin.from('naesin_templates').insert({
    title: '관계부사=전치사+관계대명사 집중훈련',
    template_topic: '관계부사(전치사+관계대명사)',
    category: 'problem',
    mode: 'interactive',
    created_by: BOSS_ID,
    questions: sanitized,
    answer_key: answerKey,
  }).select().single();
  if (error) throw error;
  console.log(`\n✓ 템플릿 생성됨: ${data.id}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
