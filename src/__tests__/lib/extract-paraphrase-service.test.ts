import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import type Anthropic from '@anthropic-ai/sdk';
import {
  extractQuestionsFromPdf, paraphraseQuestions, verifyQuestions,
  EXTRACT_MODEL, PARAPHRASE_MODEL, type ExtractAiClient,
} from '@/lib/naesin/extract-paraphrase-service';

type Params = Anthropic.MessageStreamParams;

/** 가짜 Anthropic — 호출 파라미터를 기록하고 responder가 준 배열을 JSON 텍스트로 돌려준다 */
function fakeAi(responder: (params: Params, callIndex: number) => unknown[]) {
  const calls: Params[] = [];
  const ai: ExtractAiClient = {
    messages: {
      stream(params) {
        const idx = calls.push(params) - 1;
        return {
          finalMessage: async () => {
            const arr = responder(params, idx); // throw 하면 reject
            return {
              id: 'msg', type: 'message', role: 'assistant', model: params.model, stop_reason: 'end_turn', stop_sequence: null,
              usage: { input_tokens: 0, output_tokens: 0 },
              content: [{ type: 'text', text: JSON.stringify(arr) }],
            } as unknown as Anthropic.Message;
          },
        };
      },
    },
  };
  return { ai, calls };
}

const promptText = (p: Params) => {
  const c = p.messages[0].content;
  if (typeof c === 'string') return c;
  const t = c.find((b) => b.type === 'text');
  return t && t.type === 'text' ? t.text : '';
};
const docBlock = (p: Params) => {
  const c = p.messages[0].content;
  return typeof c === 'string' ? null : c.find((b) => b.type === 'document');
};

async function pdfBase64(pages: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  return Buffer.from(await doc.save()).toString('base64');
}

const instr = (n: number) => ({ question: `다음 빈칸에 알맞은 말을 쓰시오. Sentence number ${n} goes here.`, answer: `a${n}`, options: null });

describe('paraphraseQuestions', () => {
  it('12문항 단위로 나눠 병렬 호출하고 결과를 순서대로 합친다', async () => {
    const originals = Array.from({ length: 25 }, (_, i) => ({ question: `Q${i} is a unique sentence.`, answer: String(i) }));
    const { ai, calls } = fakeAi((_p, i) => [{ question: `paraphrased chunk ${i}`, answer: 'x' }]);
    const { questions, chunkCount } = await paraphraseQuestions(ai, originals, '중2 3과');
    expect(chunkCount).toBe(3);
    expect(calls).toHaveLength(3);
    expect(questions.map((q) => q.question)).toEqual(['paraphrased chunk 0', 'paraphrased chunk 1', 'paraphrased chunk 2']);
    expect(calls[0].model).toBe(PARAPHRASE_MODEL);
    expect(promptText(calls[0])).toContain('중2 3과');
  });
});

describe('verifyQuestions', () => {
  it('12문항 단위 고정 청크, thinking 켬, wrong/broken만 돌려준다', async () => {
    const qs = Array.from({ length: 13 }, (_, i) => ({ number: i + 1, question: `Q${i}`, answer: 'a' }));
    const { ai, calls } = fakeAi((_p, i) => i === 0
      ? [{ number: 1, verdict: 'ok' }, { number: 2, verdict: 'wrong', aiAnswer: 'b', reason: '비문' }]
      : [{ number: 13, verdict: 'broken' }]);
    const { issues } = await verifyQuestions(ai, qs, '단원');
    expect(calls).toHaveLength(2);
    expect(issues.map((i) => i.number)).toEqual([2, 13]);
    expect((calls[0] as { thinking?: { type: string } }).thinking?.type).toBe('adaptive');
  });
});

describe('extractQuestionsFromPdf', () => {
  it('소형 PDF(base64) → 통짜 1회 호출, 그림 문항 제거, halfSampling=false면 전량 유지', async () => {
    const b64 = await pdfBase64(2);
    const { ai, calls } = fakeAi(() => [
      instr(1), { question: '다음 그림을 보고 알맞은 말을 쓰시오.', answer: 'apple', options: null }, instr(2),
    ]);
    const r = await extractQuestionsFromPdf(ai, { unitId: 'u1', pdfBase64: b64, halfSampling: false });
    expect(calls).toHaveLength(1);
    expect(calls[0].model).toBe(EXTRACT_MODEL);
    const doc = docBlock(calls[0]) as { source: { type: string; data?: string } };
    expect(doc.source.type).toBe('base64');
    expect(doc.source.data).toBe(b64);
    expect(promptText(calls[0])).not.toContain('일부 조각');
    expect(r.removedImageCount).toBe(1);
    expect(r.extractedTotal).toBe(2);
    expect(r.questions.map((q) => q.answer)).toEqual(['a1', 'a2']);
    expect(r.chunkCount).toBe(1);
  });

  it('pdfUrl → 주입한 fetchPdf로 내려받고, 소형이면 URL 문서 블록으로 통짜 호출', async () => {
    const bytes = Buffer.from(await pdfBase64(1), 'base64');
    let fetched = '';
    const { ai, calls } = fakeAi(() => [instr(1)]);
    const r = await extractQuestionsFromPdf(ai, {
      unitId: 'u1', pdfUrl: 'https://x.test/a.pdf', halfSampling: false,
      fetchPdf: async (u) => { fetched = u; return new Uint8Array(bytes); },
    });
    expect(fetched).toBe('https://x.test/a.pdf');
    const doc = docBlock(calls[0]) as { source: { type: string; url?: string } };
    expect(doc.source).toEqual({ type: 'url', url: 'https://x.test/a.pdf' });
    expect(r.questions).toHaveLength(1);
  });

  it('13페이지 PDF → 3조각 병렬 추출(조각 프롬프트), 겹침 중복 제거', async () => {
    const b64 = await pdfBase64(13);
    const { ai, calls } = fakeAi((_p, i) => i === 0
      ? [instr(1), instr(2)]
      : i === 1 ? [instr(2), instr(3)] // 2번은 겹침 페이지 중복
      : [instr(4)]);
    const r = await extractQuestionsFromPdf(ai, { unitId: 'u1', pdfBase64: b64, halfSampling: false });
    expect(calls).toHaveLength(3);
    for (const c of calls) {
      expect(promptText(c)).toContain('일부 조각');
      expect((docBlock(c) as { source: { data: string } }).source.data).not.toBe(b64); // 조각이 들어감
    }
    expect(r.chunkCount).toBe(3);
    expect(r.perChunk).toEqual([2, 2, 1]);
    expect(r.deduped).toBe(1);
    expect(r.questions.map((q) => q.answer)).toEqual(['a1', 'a2', 'a3', 'a4']);
  });

  it('조각 추출이 하나라도 실패하면 통짜 추출로 폴백', async () => {
    const b64 = await pdfBase64(13);
    const { ai, calls } = fakeAi((p) => {
      if (promptText(p).includes('일부 조각')) throw new Error('chunk broken');
      return [instr(1)];
    });
    const r = await extractQuestionsFromPdf(ai, { unitId: 'u1', pdfBase64: b64, halfSampling: false });
    expect(calls).toHaveLength(4); // 조각 3 실패 + 통짜 1
    expect(promptText(calls[3])).not.toContain('일부 조각');
    expect(r.chunkCount).toBe(1);
    expect(r.questions).toHaveLength(1);
  });

  it('기본(halfSampling 생략)은 같은 지시문 묶음에서 교대 추출한다', async () => {
    const b64 = await pdfBase64(1);
    const { ai } = fakeAi(() => Array.from({ length: 10 }, (_, i) => instr(i + 1)));
    const r = await extractQuestionsFromPdf(ai, { unitId: 'u1', pdfBase64: b64 });
    expect(r.extractedTotal).toBe(10);
    expect(r.questions.length).toBeLessThan(10);
    expect(r.questions.length).toBeGreaterThan(0);
  });
});
