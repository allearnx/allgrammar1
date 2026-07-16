import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { splitPdfIntoChunks } from '@/lib/split-pdf';

async function makePdf(pages: number): Promise<File> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage();
  const bytes = await doc.save();
  return new File([new Uint8Array(bytes)], 'book.pdf', { type: 'application/pdf' });
}

async function pageCount(file: File): Promise<number> {
  const doc = await PDFDocument.load(await file.arrayBuffer());
  return doc.getPageCount();
}

describe('splitPdfIntoChunks', () => {
  it('7페이지 PDF를 3페이지씩 → 3/3/1 청크로 분할한다', async () => {
    const file = await makePdf(7);
    const chunks = await splitPdfIntoChunks(file, 3);
    expect(chunks).toHaveLength(3);
    expect(await pageCount(chunks[0])).toBe(3);
    expect(await pageCount(chunks[1])).toBe(3);
    expect(await pageCount(chunks[2])).toBe(1);
    expect(chunks[0].name).toBe('book.p1-3.pdf');
    expect(chunks[2].name).toBe('book.p7-7.pdf');
  });

  it('청크 이하 분량이면 원본 그대로 반환', async () => {
    const file = await makePdf(3);
    const chunks = await splitPdfIntoChunks(file, 3);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(file);
  });

  it('PDF가 아니면 원본 그대로 반환', async () => {
    const img = new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' });
    expect(await splitPdfIntoChunks(img, 3)).toEqual([img]);
  });

  it('손상된 PDF는 분할 실패 시 원본 그대로 반환', async () => {
    const broken = new File([new Uint8Array([0, 1, 2, 3])], 'x.pdf', { type: 'application/pdf' });
    expect(await splitPdfIntoChunks(broken, 3)).toEqual([broken]);
  });
});
