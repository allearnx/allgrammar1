/**
 * 추출용 PDF 물리 분할 — 큰 PDF를 통짜로 추출시키면 모델이 앞 몇 페이지만 뽑고 멈춘다
 * (30페이지 워크북에서 17문항만 추출된 실사례). 프롬프트로 "N~M페이지만" 지정하는 방식은
 * 모델이 페이지 위치를 못 짚어 실패(E2E 확인) → pdf-lib로 물리 분할해 조각만 보낸다.
 * 경계에 걸친 문항을 위해 조각끼리 1페이지씩 겹치고, 잘린 문항은 프롬프트 지시 + 코드 dedup으로 정리.
 *
 * lib/ai/extract-problems.ts의 splitPdfIntoChunks(겹침 없음·암호화 무시·소형도 1조각 반환)와는
 * 폴백 규칙이 달라 별도 유지 — 이쪽은 "분할 못 하면 null → 통짜 추출" 계약.
 */
export const EXTRACT_PAGES_PER_CHUNK = 6;
export const EXTRACT_PAGE_OVERLAP = 1;

/**
 * PDF 바이트(또는 base64)를 6페이지(1페이지 겹침) base64 조각들로 분할.
 * 분할이 불가능하면(암호화·손상·조각 크기 이하 소형 문서) null — 호출측이 통짜 추출로 폴백.
 */
export async function splitPdfForExtract(
  source: Uint8Array | string,
  pagesPerChunk = EXTRACT_PAGES_PER_CHUNK,
  overlap = EXTRACT_PAGE_OVERLAP,
): Promise<string[] | null> {
  try {
    const { PDFDocument } = await import('pdf-lib');
    const src = await PDFDocument.load(source); // 암호화면 throw → 통짜 폴백
    const total = src.getPageCount();
    if (total <= pagesPerChunk) return null;
    const step = Math.max(1, pagesPerChunk - overlap);
    const chunks: string[] = [];
    for (let start = 0; start < total; start += step) {
      const end = Math.min(start + pagesPerChunk, total);
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, Array.from({ length: end - start }, (_, i) => start + i));
      for (const p of pages) doc.addPage(p);
      chunks.push(Buffer.from(await doc.save()).toString('base64'));
      if (end >= total) break;
    }
    return chunks;
  } catch {
    return null;
  }
}
