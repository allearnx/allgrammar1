/**
 * 오답 데이터에 누락된 options/explanation/imageUrl을 시트에서 보강.
 * question_data에 없지만 sheet.questions에 있으면 채워넣고,
 * 응답 크기를 줄이기 위해 sheet.questions는 제거한다.
 */
export function enrichWrongAnswersFromSheet(data: Record<string, unknown>[]): void {
  for (const item of data) {
    if (item.stage !== 'problem') continue;
    const sheet = item.sheet as { id: string; title: string; questions?: unknown[] } | null;
    if (!sheet?.questions) continue;

    const qd = item.question_data as Record<string, unknown>;
    const idx = Number(qd.number) - 1;
    if (idx < 0 || idx >= sheet.questions.length) continue;

    const sheetQ = sheet.questions[idx] as Record<string, unknown>;
    if (!sheetQ) continue;

    if (!qd.options && sheetQ.options) qd.options = sheetQ.options;
    if (!qd.explanation && sheetQ.explanation) qd.explanation = sheetQ.explanation;
    if (!qd.imageUrl && sheetQ.imageUrl) qd.imageUrl = sheetQ.imageUrl;
  }

  // Strip questions from sheet to keep response small
  for (const item of data) {
    const sheet = item.sheet as Record<string, unknown> | null;
    if (sheet) delete sheet.questions;
  }
}
