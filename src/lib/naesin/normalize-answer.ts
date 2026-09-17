/**
 * answer_key 항목이 객체({ answer, number })일 때 answer 문자열만 추출.
 * 문자열/숫자면 그대로, 그 외는 빈 문자열 반환.
 */
export function extractAnswer(val: unknown): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && 'answer' in (val as Record<string, unknown>)) {
    return String((val as Record<string, unknown>).answer ?? '');
  }
  return '';
}

/** ①②③④⑤ → 1,2,3,4,5 변환 맵 */
const CIRCLED_TO_NUM: Record<string, string> = {
  '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
  '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10',
};

/** circled number(①②③④⑤)를 plain number로 변환. 연속된 경우 comma 구분 (①③→"1,3") */
export function uncircle(s: string): string {
  return s.replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (match) =>
    [...match].map((ch) => CIRCLED_TO_NUM[ch] ?? ch).join(','),
  );
}

/** 정규화: 대소문자 무시, 앞뒤 공백, 끝 마침표, 연속 공백 → 단일 공백 */
export function normalize(s: string): string {
  return s
    .replace(/[\r\n\t]/g, ' ')           // 개행/탭 → 공백
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'") // 곡선 작은따옴표 → 직선
    .replace(/[\u201C\u201D]/g, '"')     // 곡선 큰따옴표 → 직선
    .replace(/[\u2013\u2014\u2212]/g, '-') // 엔대시/엠대시 → 하이픈
    .trim()
    .toLowerCase()
    // 축약형 ↔ 비축약형 동등 처리: 학생/정답 양쪽에 같은 확장을 적용해 비교하므로
    // "It's ~"와 "It is ~", "isn't"와 "is not"이 서로 정답 인정됨 (동아윤 검수에서 확정).
    // 소유격 's는 확장하지 않도록 호스트를 대명사·의문사·there로 제한.
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bcan not\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/([a-z])n't\b/g, '$1 not')  // isn't/aren't/wasn't/don't/didn't...
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\b(you|we|they)'re\b/g, '$1 are')
    .replace(/\b(i|you|we|they|he|she|it|there|who|what)'ll\b/g, '$1 will')
    .replace(/\b(i|you|we|they)'ve\b/g, '$1 have')
    .replace(/\b(it|that|there|he|she|what|who|where|when|how|here)'s\b/g, '$1 is')
    .replace(/\s+([?!.,;:])/g, '$1')     // 구두점 앞 공백 제거 ("world ?" 오답 처리 실사고)
    .replace(/\.+\s*$/, '')              // 끝 마침표 제거
    .replace(/\((\d+)\)\s*/g, '($1) ')   // (1)that → (1) that 통일
    .replace(/\s*\/\s*/g, ' / ')         // A/B, A /B → A / B 통일
    .replace(/\s+/g, ' ')               // 연속 공백 → 단일
    .trim();                             // 슬래시 정규화 후 trim 재적용
}

/** 구분자(쉼표, 슬래시) 무시 비교용 정규화 */
export function normalizeSeparators(s: string): string {
  return normalize(s)
    .replace(/\s*[,/]\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 복수 정답(예: "1,3" / "1, 3" / "3, 1") 정규화: 공백 제거 + 숫자 정렬 */
function normalizeMultiSelect(s: string): string {
  const parts = s.split(',').map((v) => v.trim());
  if (parts.length <= 1) return s.trim().toLowerCase();
  // All parts are integers → sort numerically
  if (parts.every((p) => /^\d+$/.test(p))) {
    return parts.sort((a, b) => Number(a) - Number(b)).join(', ');
  }
  return parts.map((p) => p.toLowerCase()).sort().join(', ');
}

/**
 * 객관식 정답 매칭: 학생 답(1-indexed 번호)이 정답과 일치하는지 확인.
 * 정답이 번호가 아닌 텍스트로 저장된 경우도 처리한다.
 * 복수 정답(모두고르기)도 정규화하여 비교한다.
 */
export function matchMcqAnswer(
  userAnswer: string,
  correctAnswer: string,
  options?: string[],
): boolean {
  // 0차: circled number 변환 (①→1, ②→2, ...)
  const uPlain = uncircle(userAnswer).trim().toLowerCase();
  const cPlain = uncircle(correctAnswer).trim().toLowerCase();

  // 1차: 직접 비교 (circled number 변환 후)
  if (uPlain === cPlain) {
    return true;
  }
  // 1.5차: 복수 정답 정규화 비교 ("1,3" vs "1, 3" vs "3, 1" vs "①③")
  if (cPlain.includes(',') || uPlain.includes(',')) {
    if (normalizeMultiSelect(uPlain) === normalizeMultiSelect(cPlain)) {
      return true;
    }
  }
  if (!options || options.length === 0) return false;
  // 2차: 학생 답이 번호이고 정답이 텍스트인 경우
  const idx = parseInt(uPlain, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= options.length) {
    if (options[idx - 1].trim().toLowerCase() === cPlain) {
      return true;
    }
  }
  // 3차: 정답이 번호이고 학생 답이 텍스트인 경우
  const cidx = parseInt(cPlain, 10);
  if (!isNaN(cidx) && cidx >= 1 && cidx <= options.length) {
    if (options[cidx - 1].trim().toLowerCase() === uPlain) {
      return true;
    }
  }
  return false;
}

/**
 * 서술형 부분 일치: 학생 답이 정답의 앞부분/뒷부분과 일치하면 정답 처리.
 * 배열 문제에서 괄호 안 단어만 배열하고 나머지 고정 텍스트를 생략한 경우를 커버.
 * 조건: 학생 답 3단어 이상 + 정답 단어 수의 35% 이상.
 */
export function isSubstringMatch(student: string, correct: string): boolean {
  const s = normalize(student);
  const c = normalize(correct);

  if (s === c) return true;

  const sWords = s.split(' ');
  const cWords = c.split(' ');

  if (sWords.length < 3) return false;

  // 학생 답이 정답의 prefix 또는 suffix
  if (c.startsWith(s) || c.endsWith(s)) {
    return sWords.length / cWords.length >= 0.35;
  }

  // 정답이 학생 답의 prefix 또는 suffix (학생이 더 많이 쓴 경우)
  if (s.startsWith(c) || s.endsWith(c)) {
    return cWords.length / sWords.length >= 0.35;
  }

  // 번호 접두사를 제거한 비교: "(1) that (2) it" → "that / it" vs "that it that"
  const sNoBrackets = s.replace(/\(\d+\)\s*/g, '').replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const cNoBrackets = c.replace(/\(\d+\)\s*/g, '').replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  if (sNoBrackets === cNoBrackets && sNoBrackets.split(' ').length >= 2) {
    return true;
  }

  return false;
}

/**
 * 정답을 1-indexed 옵션 번호로 변환.
 * 이미 유효한 번호면 그대로, 텍스트면 매칭되는 옵션 번호를 반환.
 */
export function resolveCorrectIndex(correctAnswer: string, options: string[]): string {
  const plain = uncircle(correctAnswer);
  const num = parseInt(plain, 10);
  if (!isNaN(num) && num >= 1 && num <= options.length) return plain;
  const idx = options.findIndex(
    (opt) => opt.trim().toLowerCase() === correctAnswer.trim().toLowerCase(),
  );
  if (idx !== -1) return String(idx + 1);
  return correctAnswer;
}

/**
 * subParts 문항 채점: 파트별(" / " 구분) 비교가 우선.
 * 실패하면 전체 문자열을 정답·인정답안과 비교하되 구분자(쉼표/슬래시)를 무시한다.
 * 예) 빈칸 4개(so that 포함)에 입력칸 2개인 문항에서 학생이 "stay / so that, explain"을
 *     쓴 경우, 인정답안 "stay, so that, explain"과 같은 답으로 본다 (김유민 5과 19~21번 실사고).
 */
export function matchSubParts(
  userAnswer: string,
  subParts: { answer: string; acceptedAnswers?: string[] }[],
  wholeCandidates: (string | number | undefined | null)[] = [],
): boolean {
  // " / " 구분이 기본. 개수가 안 맞으면 줄바꿈 구분도 허용하고, 각 파트 앞의 라벨("(1)", "ㄱ:", "㉠", "(A):")은 뗀다.
  let parts = userAnswer.split(' / ');
  if (parts.length !== subParts.length && userAnswer.includes('\n')) parts = userAnswer.split(/\n+/);
  parts = parts.map((p) => stripLeadingLabels(p));
  const partsOk = subParts.every((sp, j) => {
    const studentNorm = normalize(parts[j]?.trim() ?? '');
    const candidates = [sp.answer, ...(sp.acceptedAnswers ?? [])];
    return candidates.some((c) => normalize(c) === studentNorm);
  });
  if (partsOk) return true;

  const whole = wholeCandidates.map(extractAnswer).filter((c) => c !== '');
  const studentNorm = normalize(userAnswer);
  if (whole.some((c) => normalize(c) === studentNorm)) return true;
  const studentSep = normalizeSeparators(userAnswer);
  return whole.some((c) => normalizeSeparators(c) === studentSep);
}

/** 빈칸(밑줄 2개 이상). 공백만으로 이어진 인접 빈칸("_____ _____")은 하나로 본다. */
const BLANK_RE = /_{2,}(?:[ \t]+_{2,})*/g;
/** 문항 라벨: (A) (1) 2-1. ㉠ ㊀ ㄱ: A: • → 등 — 학생 답·문제 문장 앞에서 제거 */
const LEADING_LABEL_RE = /^\s*(?:\d+-\d+\s*[.:)]?|\(?[A-Za-z0-9]\)\s*:?|[㉠-㉭㊀-㊉]\s*:?|[ㄱ-ㅎ]\s*[:.]|[A-Z]\s*:|[•·→\-])\s*/;
const MAX_VARIANTS = 64;

function stripLeadingLabels(s: string): string {
  let prev = '';
  let cur = s;
  while (cur !== prev) {
    prev = cur;
    cur = cur.replace(LEADING_LABEL_RE, '');
  }
  return cur.trim();
}

/** 문장 단위 분리: 줄바꿈 + 문장 종결부호 뒤 공백 (iOS 구형 Safari 호환을 위해 lookbehind 미사용) */
function splitSentences(text: string): string[] {
  return text
    .replace(/([.?!])\s+/g, '$1\n')
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function fillVariants(sentence: string, candidates: string[][]): string[] {
  let variants = [''];
  const pieces = sentence.split(BLANK_RE);
  for (let i = 0; i < pieces.length; i++) {
    const next: string[] = [];
    const fills = i < pieces.length - 1 ? candidates[i] : [''];
    for (const v of variants) {
      for (const f of fills) {
        next.push(v + pieces[i] + f);
        if (next.length >= MAX_VARIANTS) break;
      }
      if (next.length >= MAX_VARIANTS) break;
    }
    variants = next;
  }
  return variants;
}

/**
 * 빈칸 문항에 학생이 "빈칸을 채운 완전한 문장"을 쓴 경우 정답 인정.
 * 문제 본문에서 빈칸(___)이 있는 문장만 골라 정답(파트별 인정답안 포함)을 채워 넣고,
 * 학생 답을 문장 단위로 나눠 순서대로 정확히 일치할 때만 정답으로 본다.
 * 학생이 문제의 빈칸 없는 문장을 그대로 베껴 쓴 것("I am so sleepy.")은 무시한다.
 * (이동형 과거형 Step2 #9 "He doesn't have an older sister." → 정답 "doesn't have"인데 오답 처리된 실사고)
 */
export function matchFilledBlanks(
  userAnswer: string,
  question: string | undefined | null,
  correctAnswer: string,
  acceptedAnswers: string[] = [],
  subParts?: { answer: string; acceptedAnswers?: string[] }[],
): boolean {
  if (!question || !/[A-Za-z]/.test(userAnswer)) return false;
  // 빈칸 바로 앞의 라벨("(A)______", "㉠______")은 문장 중간이어도 제거
  const cleaned = question.replace(/(?:\(?[A-Za-z0-9]\)|[㉠-㉭㊀-㊉])\s*(?=_{2,})/g, '');
  const sentences = splitSentences(cleaned).map(stripLeadingLabels);
  const blankSentences = sentences.filter((s) => BLANK_RE.test(s) && (BLANK_RE.lastIndex = 0) === 0);
  if (blankSentences.length === 0) return false;
  const plainSentences = new Set(
    sentences.filter((s) => !blankSentences.includes(s)).map((s) => normalize(s)).filter(Boolean),
  );
  const blankCounts = blankSentences.map((s) => (s.match(BLANK_RE) ?? []).length);
  const total = blankCounts.reduce((a, b) => a + b, 0);

  // 빈칸별 후보: subParts 우선, 없으면 정답을 " / " 또는 ","로 나눠 개수가 맞을 때만
  let perBlank: string[][] | null = null;
  if (subParts && subParts.length === total) {
    perBlank = subParts.map((sp) => [sp.answer, ...(sp.acceptedAnswers ?? [])]);
  } else {
    const splitBy = (s: string): string[] | null => {
      for (const sep of [/\s*\/\s*/, /\s*,\s*/]) {
        const parts = s.split(sep).map((p) => p.trim()).filter(Boolean);
        if (parts.length === total) return parts;
      }
      return total === 1 ? [s.trim()] : null;
    };
    for (const cand of [correctAnswer, ...acceptedAnswers]) {
      const parts = splitBy(cand);
      if (!parts) continue;
      perBlank ??= parts.map(() => []);
      parts.forEach((p, i) => perBlank![i].push(p));
    }
  }
  if (!perBlank) return false;

  let offset = 0;
  const expected = blankSentences.map((s, i) => {
    const variants = fillVariants(s, perBlank!.slice(offset, offset + blankCounts[i]));
    offset += blankCounts[i];
    return new Set(variants.map((v) => normalize(v)));
  });

  const segments = splitSentences(userAnswer.replace(/\s*\/\s*/g, '\n'))
    .map(stripLeadingLabels)
    .map((s) => normalize(s))
    .filter((s) => s && !plainSentences.has(s));
  if (segments.length !== expected.length) return false;
  return segments.every((seg, i) => expected[i].has(seg));
}
