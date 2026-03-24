import { describe, it, expect } from 'vitest';
import {
  vocabProgressSchema,
  grammarProgressSchema,
  passageProgressSchema,
  videoProgressSchema,
  omrSubmitSchema,
  problemSubmitSchema,
  wrongAnswerCreateSchema,
  wrongAnswerPatchSchema,
  quizSetResultSchema,
  gradeTranslationSchema,
  textbookCreateSchema,
  unitCreateSchema,
  vocabCreateSchema,
  vocabBulkSchema,
  vocabQuizSetCreateSchema,
  examDateSchema,
  settingsSchema,
  idSchema,
  academyCreateSchema,
  userPatchSchema,
  teacherPatchSchema,
  memoryProgressSchema,
  textbookProgressSchema,
  reportGenerateSchema,
  grammarLessonCreateSchema,
} from '@/lib/api/schemas';

describe('vocabProgressSchema', () => {
  it('accepts valid flashcard progress', () => {
    const result = vocabProgressSchema.safeParse({
      unitId: 'u1',
      type: 'flashcard',
      score: 80,
      totalItems: 10,
    });
    expect(result.success).toBe(true);
  });

  it('accepts quiz and spelling types', () => {
    expect(vocabProgressSchema.safeParse({ unitId: 'u1', type: 'quiz' }).success).toBe(true);
    expect(vocabProgressSchema.safeParse({ unitId: 'u1', type: 'spelling' }).success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = vocabProgressSchema.safeParse({ unitId: 'u1', type: 'unknown' });
    expect(result.success).toBe(false);
  });

  it('rejects missing unitId', () => {
    const result = vocabProgressSchema.safeParse({ type: 'quiz' });
    expect(result.success).toBe(false);
  });
});

describe('grammarProgressSchema', () => {
  it('accepts video type', () => {
    expect(grammarProgressSchema.safeParse({ unitId: 'u1', type: 'video' }).success).toBe(true);
  });

  it('accepts text type', () => {
    expect(grammarProgressSchema.safeParse({ unitId: 'u1', type: 'text' }).success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(grammarProgressSchema.safeParse({ unitId: 'u1', type: 'audio' }).success).toBe(false);
  });
});

describe('passageProgressSchema', () => {
  it('accepts valid progress', () => {
    const result = passageProgressSchema.safeParse({
      unitId: 'u1',
      type: 'fill_blanks',
      score: 90,
    });
    expect(result.success).toBe(true);
  });

  it('requires score (not optional)', () => {
    const result = passageProgressSchema.safeParse({ unitId: 'u1', type: 'translation' });
    expect(result.success).toBe(false);
  });

  it('accepts all passage types', () => {
    for (const type of ['fill_blanks', 'ordering', 'translation']) {
      expect(passageProgressSchema.safeParse({ unitId: 'u1', type, score: 50 }).success).toBe(true);
    }
  });
});

describe('videoProgressSchema', () => {
  it('requires only lessonId', () => {
    const result = videoProgressSchema.safeParse({ lessonId: 'l1' });
    expect(result.success).toBe(true);
  });

  it('accepts all optional fields', () => {
    const result = videoProgressSchema.safeParse({
      lessonId: 'l1',
      unitId: 'u1',
      position: 120.5,
      duration: 300,
      cumulativeSeconds: 250,
    });
    expect(result.success).toBe(true);
  });
});

describe('omrSubmitSchema', () => {
  it('accepts valid submission', () => {
    const result = omrSubmitSchema.safeParse({
      unitId: 'u1',
      omrSheetId: 'omr1',
      studentAnswers: { '1': 3, '2': 1 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = omrSubmitSchema.safeParse({ unitId: 'u1' });
    expect(result.success).toBe(false);
  });
});

describe('problemSubmitSchema', () => {
  it('accepts valid submission', () => {
    const result = problemSubmitSchema.safeParse({
      sheetId: 's1',
      answers: [1, 2, 'text answer'],
      totalQuestions: 3,
    });
    expect(result.success).toBe(true);
  });
});

describe('wrongAnswerCreateSchema', () => {
  it('accepts valid data', () => {
    const result = wrongAnswerCreateSchema.safeParse({
      unitId: 'u1',
      stage: 'vocab',
      sourceType: 'quiz',
      wrongAnswers: [{ word: 'apple', answer: 'banana' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty wrongAnswers array', () => {
    const result = wrongAnswerCreateSchema.safeParse({
      unitId: 'u1',
      stage: 'vocab',
      sourceType: 'quiz',
      wrongAnswers: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('wrongAnswerPatchSchema', () => {
  it('requires id, resolved is optional', () => {
    expect(wrongAnswerPatchSchema.safeParse({ id: 'wa1' }).success).toBe(true);
    expect(wrongAnswerPatchSchema.safeParse({ id: 'wa1', resolved: true }).success).toBe(true);
  });
});

describe('quizSetResultSchema', () => {
  it('accepts valid result', () => {
    const result = quizSetResultSchema.safeParse({
      quizSetId: 'qs1',
      score: 85,
    });
    expect(result.success).toBe(true);
  });
});

describe('gradeTranslationSchema', () => {
  it('requires all three text fields', () => {
    const valid = {
      koreanText: '안녕하세요',
      originalText: 'Hello',
      studentAnswer: 'Hi',
    };
    expect(gradeTranslationSchema.safeParse(valid).success).toBe(true);
    expect(gradeTranslationSchema.safeParse({ koreanText: '안녕' }).success).toBe(false);
  });
});

describe('textbookCreateSchema', () => {
  it('accepts valid textbook', () => {
    const result = textbookCreateSchema.safeParse({
      grade: '중1',
      publisher: '천재',
      display_name: '천재 중1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing publisher', () => {
    expect(textbookCreateSchema.safeParse({ grade: '중1', display_name: 'test' }).success).toBe(false);
  });
});

describe('unitCreateSchema', () => {
  it('accepts valid unit', () => {
    const result = unitCreateSchema.safeParse({
      textbook_id: 'tb1',
      unit_number: 1,
      title: 'Unit 1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-number unit_number', () => {
    expect(unitCreateSchema.safeParse({
      textbook_id: 'tb1',
      unit_number: 'one',
      title: 'Unit 1',
    }).success).toBe(false);
  });
});

describe('vocabCreateSchema', () => {
  it('requires unit_id, front_text, back_text', () => {
    expect(vocabCreateSchema.safeParse({
      unit_id: 'u1',
      front_text: 'apple',
      back_text: '사과',
    }).success).toBe(true);

    expect(vocabCreateSchema.safeParse({
      unit_id: 'u1',
      front_text: 'apple',
    }).success).toBe(false);
  });
});

describe('vocabBulkSchema', () => {
  it('accepts valid bulk items', () => {
    const result = vocabBulkSchema.safeParse({
      unit_id: 'u1',
      items: [
        { front_text: 'apple', back_text: '사과' },
        { front_text: 'banana', back_text: '바나나' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty items array', () => {
    expect(vocabBulkSchema.safeParse({ unit_id: 'u1', items: [] }).success).toBe(false);
  });
});

describe('vocabQuizSetCreateSchema', () => {
  it('requires non-empty vocabIds', () => {
    expect(vocabQuizSetCreateSchema.safeParse({
      unitId: 'u1',
      title: 'Set 1',
      vocabIds: ['v1', 'v2'],
    }).success).toBe(true);

    expect(vocabQuizSetCreateSchema.safeParse({
      unitId: 'u1',
      title: 'Set 1',
      vocabIds: [],
    }).success).toBe(false);
  });
});

describe('examDateSchema', () => {
  it('accepts valid exam date', () => {
    expect(examDateSchema.safeParse({
      textbookId: 'tb1',
      examDate: '2026-04-15',
    }).success).toBe(true);
  });
});

describe('settingsSchema', () => {
  it('requires textbookId', () => {
    expect(settingsSchema.safeParse({ textbookId: 'tb1' }).success).toBe(true);
    expect(settingsSchema.safeParse({}).success).toBe(false);
  });
});

describe('idSchema', () => {
  it('requires id string', () => {
    expect(idSchema.safeParse({ id: 'abc' }).success).toBe(true);
    expect(idSchema.safeParse({}).success).toBe(false);
    expect(idSchema.safeParse({ id: 123 }).success).toBe(false);
  });
});

describe('academyCreateSchema', () => {
  it('requires non-empty name', () => {
    expect(academyCreateSchema.safeParse({ name: '학원A' }).success).toBe(true);
    expect(academyCreateSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('userPatchSchema', () => {
  it('accepts valid role enum values', () => {
    expect(userPatchSchema.safeParse({ role: 'student' }).success).toBe(true);
    expect(userPatchSchema.safeParse({ role: 'teacher' }).success).toBe(true);
    expect(userPatchSchema.safeParse({ role: 'admin' }).success).toBe(true);
    expect(userPatchSchema.safeParse({ role: 'boss' }).success).toBe(true);
  });

  it('rejects invalid role', () => {
    expect(userPatchSchema.safeParse({ role: 'superadmin' }).success).toBe(false);
  });

  it('allows nullable academy_id', () => {
    expect(userPatchSchema.safeParse({ academy_id: null }).success).toBe(true);
    expect(userPatchSchema.safeParse({ academy_id: 'a1' }).success).toBe(true);
  });
});

describe('teacherPatchSchema', () => {
  it('requires is_active boolean', () => {
    expect(teacherPatchSchema.safeParse({ is_active: true }).success).toBe(true);
    expect(teacherPatchSchema.safeParse({ is_active: false }).success).toBe(true);
    expect(teacherPatchSchema.safeParse({}).success).toBe(false);
  });
});

describe('memoryProgressSchema', () => {
  it('accepts valid progress', () => {
    expect(memoryProgressSchema.safeParse({
      memoryItemId: 'm1',
      testType: 'flashcard',
      isCorrect: true,
    }).success).toBe(true);
  });

  it('validates testType enum', () => {
    expect(memoryProgressSchema.safeParse({
      memoryItemId: 'm1',
      testType: 'invalid',
      isCorrect: true,
    }).success).toBe(false);
  });
});

describe('textbookProgressSchema', () => {
  it('accepts all passage types', () => {
    for (const type of ['fill_blanks_easy', 'fill_blanks_medium', 'fill_blanks_hard', 'ordering', 'translation']) {
      expect(textbookProgressSchema.safeParse({
        passageId: 'p1',
        type,
        score: 70,
      }).success).toBe(true);
    }
  });

  it('rejects invalid type', () => {
    expect(textbookProgressSchema.safeParse({
      passageId: 'p1',
      type: 'fill_blanks',
      score: 70,
    }).success).toBe(false);
  });
});

describe('nullish fields accept null from JSON clients', () => {
  it('grammarLessonCreateSchema: null for optional fields', () => {
    const result = grammarLessonCreateSchema.safeParse({
      unit_id: 'u1',
      title: '현재완료',
      content_type: 'video',
      youtube_url: 'https://youtube.com/watch?v=abc',
      youtube_video_id: 'abc',
      text_content: null,
    });
    expect(result.success).toBe(true);
  });

  it('vocabCreateSchema: null for optional fields', () => {
    const result = vocabCreateSchema.safeParse({
      unit_id: 'u1',
      front_text: 'apple',
      back_text: '사과',
      part_of_speech: null,
      example_sentence: null,
      synonyms: null,
      antonyms: null,
    });
    expect(result.success).toBe(true);
  });

  it('videoProgressSchema: null for optional fields', () => {
    const result = videoProgressSchema.safeParse({
      lessonId: 'l1',
      unitId: null,
      position: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('reportGenerateSchema', () => {
  it('requires studentId', () => {
    expect(reportGenerateSchema.safeParse({ studentId: 's1' }).success).toBe(true);
    expect(reportGenerateSchema.safeParse({}).success).toBe(false);
  });
});
