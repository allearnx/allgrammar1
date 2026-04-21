/**
 * 서술형 정답 괄호 대안 자동 분리
 *
 * PDF 추출 시 "She is not tall. (She isn't tall.)" 같은 정답을
 * main + alternatives로 분리하여 acceptedAnswers에 저장.
 *
 * Pattern 1: 끝 괄호 대안  "Main text. (Alternative)"
 * Pattern 2: 인라인 또는    "...isn't (또는 is not)..."
 * 제외: 번호 패턴 "(1)", 한글 주석 "(형용사)", 비영어 괄호 내용
 */

function containsKorean(text: string): boolean {
  return /[\u3131-\uD79D]/.test(text);
}

function isPrimarilyEnglish(text: string): boolean {
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return latin >= 3;
}

function isNumberedPattern(answer: string): boolean {
  return /^\(\d+\)/.test(answer.trim());
}

function parseSingleLineTrailing(
  line: string,
): { main: string; alternatives: string[] } | null {
  const match = line.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (!match) return null;

  const mainPart = match[1].trim();
  const altPart = match[2].trim();

  if (/^\d+$/.test(altPart)) return null;
  if (altPart.length <= 2) return null;
  if (containsKorean(altPart)) return null;
  if (!isPrimarilyEnglish(altPart)) return null;

  return { main: mainPart, alternatives: [altPart] };
}

function parseTrailingParenthetical(
  answer: string,
): { main: string; alternatives: string[] } | null {
  if (answer.includes('\n')) {
    const lines = answer.split('\n');
    let anyChanged = false;
    const mainLines: string[] = [];
    const alternatives: string[] = [];

    for (const line of lines) {
      const result = parseSingleLineTrailing(line);
      if (result) {
        anyChanged = true;
        mainLines.push(result.main);
        alternatives.push(...result.alternatives);
      } else {
        mainLines.push(line);
      }
    }

    if (!anyChanged) return null;
    return { main: mainLines.join('\n'), alternatives };
  }

  return parseSingleLineTrailing(answer);
}

function parseInlineAlternative(
  answer: string,
): { main: string; alternatives: string[] } | null {
  if (!/\(또는\s+[^)]+\)/.test(answer)) return null;

  const main = answer.replace(/\s*\(또는\s+[^)]+\)/g, '');

  const matchRegex = /\(또는\s+([^)]+)\)/g;
  const matches: { fullMatch: string; altText: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = matchRegex.exec(answer)) !== null) {
    matches.push({ fullMatch: m[0], altText: m[1].trim(), index: m.index });
  }

  let alt = answer;

  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, altText, index } = matches[i];
    const before = alt.substring(0, index).trimEnd();
    const after = alt.substring(index + fullMatch.length);

    const beforeWords = before.split(/\s+/);
    const altWords = altText.split(/\s+/);
    const altFirstWord = altWords[0].toLowerCase();

    let replaceFrom = beforeWords.length - 1;
    for (
      let j = beforeWords.length - 2;
      j >= Math.max(0, beforeWords.length - 4);
      j--
    ) {
      if (beforeWords[j].toLowerCase() === altFirstWord) {
        replaceFrom = j;
        break;
      }
    }

    if (
      replaceFrom === beforeWords.length - 1 &&
      altWords.length === 1 &&
      altText.includes("'")
    ) {
      if (beforeWords.length >= 2) {
        replaceFrom = beforeWords.length - 2;
      }
    }

    const keepWords = beforeWords.slice(0, replaceFrom);
    const spacer = keepWords.length > 0 ? ' ' : '';
    alt = keepWords.join(' ') + spacer + altText + after;
  }

  return { main: main.trim(), alternatives: [alt.trim()] };
}

/**
 * 정답 문자열에서 괄호 대안을 분리.
 * 반환값이 null이면 괄호 대안이 없는 것.
 */
export function parseParentheticalAnswer(
  answer: string,
): { main: string; alternatives: string[] } | null {
  if (typeof answer !== 'string') return null;
  if (!answer.includes('(')) return null;
  if (isNumberedPattern(answer)) return null;

  // Pattern 2 먼저 (인라인 또는) — 더 구체적
  const inlineResult = parseInlineAlternative(answer);
  if (inlineResult) return inlineResult;

  // Pattern 1: 끝 괄호 대안
  const trailingResult = parseTrailingParenthetical(answer);
  if (trailingResult) return trailingResult;

  return null;
}
