/**
 * 브라우저에서 PDF를 N페이지 단위로 분할 — 대용량 단어장 추출용.
 *
 * 배경: 추출 API는 max_tokens 한도(단어 ~150개 분량) 때문에 큰 PDF를
 * 통째로 보내면 응답이 잘려 실패한다. 클라이언트에서 페이지를 쪼개
 * 순차 호출하면 서버리스 타임아웃도 함께 회피된다.
 */

/** 단어장 PDF 기준 청크당 페이지 수 (페이지당 40~50단어 가정, 출력 한도 안쪽) */
export const PDF_PAGES_PER_CHUNK = 3;

/** 분할 파일 이름에서 페이지 범위 라벨 추출 (book.p7-9.pdf → "p7-9", 아니면 파일명) */
export function chunkLabel(file: File): string {
  const m = file.name.match(/\.(p\d+-\d+)\.pdf$/i);
  return m ? m[1] : file.name;
}

/**
 * PDF 파일을 pagesPerChunk 페이지씩 잘라 여러 File로 반환.
 * PDF가 아니거나 청크 이하 분량이면 원본 그대로 [file] 반환.
 * 손상된 PDF 등 분할 실패 시에도 원본 그대로 반환 (기존 동작 유지).
 */
export async function splitPdfIntoChunks(
  file: File,
  pagesPerChunk: number = PDF_PAGES_PER_CHUNK,
): Promise<File[]> {
  if (file.type !== 'application/pdf') return [file];

  try {
    const { PDFDocument } = await import('pdf-lib');
    const bytes = await file.arrayBuffer();
    const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = src.getPageCount();
    if (total <= pagesPerChunk) return [file];

    const chunks: File[] = [];
    const baseName = file.name.replace(/\.pdf$/i, '');
    for (let start = 0; start < total; start += pagesPerChunk) {
      const end = Math.min(start + pagesPerChunk, total);
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, Array.from({ length: end - start }, (_, i) => start + i));
      for (const p of pages) doc.addPage(p);
      const out = await doc.save();
      chunks.push(
        new File([new Uint8Array(out)], `${baseName}.p${start + 1}-${end}.pdf`, { type: 'application/pdf' }),
      );
    }
    return chunks;
  } catch {
    // 분할 실패(암호화·손상 등) → 통짜로 시도 (서버의 잘림 감지가 안내)
    return [file];
  }
}
