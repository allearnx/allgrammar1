import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { splitPdfForExtract } from '@/lib/naesin/split-pdf-for-extract';

async function makePdf(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([200, 200]);
  return doc.save();
}
async function pageCount(base64: string) {
  return (await PDFDocument.load(Buffer.from(base64, 'base64'))).getPageCount();
}

describe('splitPdfForExtract — 6페이지·1페이지 겹침 물리 분할', () => {
  it('조각 크기 이하(6페이지)면 null → 통짜 추출 폴백', async () => {
    expect(await splitPdfForExtract(await makePdf(6))).toBeNull();
    expect(await splitPdfForExtract(await makePdf(1))).toBeNull();
  });

  it('13페이지 → 3조각 (1~6, 6~11, 11~13), 각 조각 페이지 수 6·6·3', async () => {
    const chunks = await splitPdfForExtract(await makePdf(13));
    expect(chunks).not.toBeNull();
    expect(chunks!).toHaveLength(3);
    expect(await Promise.all(chunks!.map(pageCount))).toEqual([6, 6, 3]);
  });

  it('마지막 페이지가 겹침으로 이미 포함되면 조각을 더 만들지 않는다 (11페이지 → 2조각)', async () => {
    const chunks = await splitPdfForExtract(await makePdf(11));
    expect(await Promise.all(chunks!.map(pageCount))).toEqual([6, 6]);
  });

  it('base64 문자열 입력도 받는다', async () => {
    const b64 = Buffer.from(await makePdf(8)).toString('base64');
    const chunks = await splitPdfForExtract(b64);
    expect(await Promise.all(chunks!.map(pageCount))).toEqual([6, 3]);
  });

  it('손상된 입력은 null (throw 하지 않음)', async () => {
    expect(await splitPdfForExtract(new Uint8Array([1, 2, 3]))).toBeNull();
    expect(await splitPdfForExtract('not-a-pdf')).toBeNull();
  });
});
