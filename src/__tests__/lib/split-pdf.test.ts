import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { splitPdfIntoChunks, planPdfChunks, refinePdfChunk } from '@/lib/split-pdf';

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

  it('이미 분할된 청크를 재분할하면 원본 페이지 번호를 유지한다 (p4-6 → p4,p5,p6)', async () => {
    const original = await makePdf(7);
    const chunks = await splitPdfIntoChunks(original, 3);
    // 2번째 청크(book.p4-6.pdf)를 1페이지씩 재분할
    const finer = await splitPdfIntoChunks(chunks[1], 1);
    expect(finer.map((f) => f.name)).toEqual(['book.p4-4.pdf', 'book.p5-5.pdf', 'book.p6-6.pdf']);
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

describe('planPdfChunks / refinePdfChunk', () => {
  it('일반 PDF는 물리 분할 청크 (파일 분리 + 라벨)', async () => {
    const file = await makePdf(7);
    const chunks = await planPdfChunks(file, 3);
    expect(chunks).toHaveLength(3);
    expect(chunks[0].pageFrom).toBeUndefined();
    expect(chunks.map((c) => c.label)).toEqual(['p1-3', 'p4-6', 'p7-7']);
  });

  it('PDF가 아니면 통짜 청크 하나', async () => {
    const img = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
    const chunks = await planPdfChunks(img, 3);
    expect(chunks).toEqual([{ file: img, label: 'a.png' }]);
  });

  it('페이지 범위 청크(암호화 PDF용)를 1페이지 단위로 세분화한다', async () => {
    const file = await makePdf(1); // 파일 자체는 무관 — 범위만 세분화
    const finer = await refinePdfChunk({ file, pageFrom: 4, pageTo: 6, label: 'p4-6' });
    expect(finer).toEqual([
      { file, pageFrom: 4, pageTo: 4, label: 'p4-4' },
      { file, pageFrom: 5, pageTo: 5, label: 'p5-5' },
      { file, pageFrom: 6, pageTo: 6, label: 'p6-6' },
    ]);
  });

  it('물리 분할 청크는 파일을 1페이지씩 재분할한다', async () => {
    const file = await makePdf(7);
    const chunks = await planPdfChunks(file, 3);
    const finer = await refinePdfChunk(chunks[1]); // p4-6
    expect(finer.map((c) => c.label)).toEqual(['p4-4', 'p5-5', 'p6-6']);
  });
});
