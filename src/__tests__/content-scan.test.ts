import { describe, it, expect } from 'vitest';
import { scanRow, runContentScan, aggregate, type ScanRow } from '@/lib/validation/content-scan';

const opts5 = ['a', 'b', 'c', 'd', 'e'];

describe('scanRow', () => {
  it('MCQ 범위 초과 → correctness MCQ_RANGE', () => {
    const row: ScanRow = {
      id: 's1', title: 'sheet1',
      questions: [{ number: 1, question: 'Q', answer: '7', options: opts5, explanation: 'x' }],
      answer_key: ['7'],
    };
    const issues = scanRow('sheet', row);
    const mcq = issues.find((i) => i.code === 'MCQ_RANGE');
    expect(mcq).toBeTruthy();
    expect(mcq!.category).toBe('correctness');
    expect(mcq!.source).toBe('sheet');
  });

  it('해설 없음 → quality NO_EXPLANATION (correctness 아님)', () => {
    const row: ScanRow = {
      id: 's2', title: 'sheet2',
      questions: [{ number: 1, question: 'Write a sentence.', answer: 'The cat sat.' }],
      answer_key: ['The cat sat.'],
    };
    const issues = scanRow('sheet', row);
    const ne = issues.find((i) => i.code === 'NO_EXPLANATION');
    expect(ne).toBeTruthy();
    expect(ne!.category).toBe('quality');
  });

  it('answer_key가 문항보다 짧음 → correctness PARTIAL_ANSWER_KEY (RAW 기준)', () => {
    const row: ScanRow = {
      id: 's3', title: 'sheet3',
      questions: Array.from({ length: 5 }, (_, i) => ({ number: i + 1, question: `Q${i + 1}`, answer: '3', options: opts5, explanation: 'x' })),
      answer_key: ['3', '3', '3'], // 5문항인데 3개
    };
    const issues = scanRow('sheet', row);
    const p = issues.find((i) => i.code === 'PARTIAL_ANSWER_KEY');
    expect(p).toBeTruthy();
    expect(p!.category).toBe('correctness');
    expect(p!.questionNumber).toBeNull(); // 시트 레벨
  });

  it('sanitize-first: 원형숫자 정답 "③"은 가짜경보 안 냄 (sanitize가 "3"으로 변환)', () => {
    const row: ScanRow = {
      id: 's4', title: 'sheet4',
      questions: [{ number: 1, question: 'Choose', answer: '③', options: opts5, explanation: 'x' }],
      answer_key: ['③'],
    };
    const issues = scanRow('sheet', row);
    // sanitize가 ③→3 변환하므로 CIRCLED_NUMBER도 TEXT_NOT_IN_OPTIONS도 없어야 함
    expect(issues.some((i) => i.code === 'CIRCLED_NUMBER')).toBe(false);
    expect(issues.some((i) => i.code === 'TEXT_NOT_IN_OPTIONS')).toBe(false);
    expect(issues).toHaveLength(0);
  });

  it('빈 문항 배열은 0건', () => {
    expect(scanRow('template', { id: 't', title: 't', questions: [], answer_key: [] })).toHaveLength(0);
  });
});

describe('aggregate', () => {
  it('코드별/카테고리별 카운트', () => {
    const r = aggregate(
      [
        { source: 'sheet', id: 'a', title: 'a', questionNumber: 1, code: 'MCQ_RANGE', severity: 'error', category: 'correctness', message: '' },
        { source: 'sheet', id: 'a', title: 'a', questionNumber: 2, code: 'MCQ_RANGE', severity: 'error', category: 'correctness', message: '' },
        { source: 'sheet', id: 'b', title: 'b', questionNumber: 1, code: 'NO_EXPLANATION', severity: 'warning', category: 'quality', message: '' },
      ],
      10,
    );
    expect(r.countsByCode.MCQ_RANGE).toBe(2);
    expect(r.countsByCategory).toEqual({ correctness: 2, quality: 1 });
    expect(r.rowsScanned).toBe(10);
  });
});

// 페이지네이션 지원하는 mock supabase
function mockDb(data: Record<string, ScanRow[]>) {
  return {
    from(table: string) {
      return {
        select() {
          return {
            range(from: number, to: number) {
              const rows = data[table] ?? [];
              return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
            },
          };
        },
      };
    },
  };
}

describe('runContentScan', () => {
  const sheets: ScanRow[] = [
    { id: 's1', title: 'MCQ범위', questions: [{ number: 1, question: 'Q', answer: '7', options: opts5, explanation: 'x' }], answer_key: ['7'] },
    { id: 's2', title: '해설없음', questions: [{ number: 1, question: 'Write.', answer: 'cat' }], answer_key: ['cat'] },
  ];
  const templates: ScanRow[] = [
    { id: 't1', title: '깨끗', questions: [{ number: 1, question: 'Q', answer: '3', options: opts5, explanation: 'x' }], answer_key: ['3'] },
  ];

  it('전체 스캔: correctness + quality 모두 집계', async () => {
    const r = await runContentScan(mockDb({ naesin_problem_sheets: sheets, naesin_templates: templates }));
    expect(r.rowsScanned).toBe(3);
    expect(r.countsByCode.MCQ_RANGE).toBe(1);
    expect(r.countsByCode.NO_EXPLANATION).toBe(1);
    expect(r.countsByCategory.correctness).toBe(1);
    expect(r.countsByCategory.quality).toBe(1);
  });

  it('correctnessOnly: quality 노이즈 제외', async () => {
    const r = await runContentScan(mockDb({ naesin_problem_sheets: sheets, naesin_templates: templates }), { correctnessOnly: true });
    expect(r.countsByCategory.quality).toBe(0);
    expect(r.issues.every((i) => i.category === 'correctness')).toBe(true);
    expect(r.countsByCode.MCQ_RANGE).toBe(1);
  });
});
