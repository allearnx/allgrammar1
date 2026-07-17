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
 * 추출 작업 단위. 일반 PDF는 물리 분할된 파일, 암호화 PDF는 원본 파일 + 페이지 범위.
 * (암호화 PDF를 pdf-lib로 물리 분할하면 내용이 깨져 AI에게 백지로 보인다 —
 * 대신 원본을 통째로 보내고 프롬프트로 "N~M페이지만"을 지정한다)
 */
export interface PdfChunk {
  file: File;
  pageFrom?: number;
  pageTo?: number;
  label: string;
}

/** 파일을 추출 작업 단위로 계획 — 암호화 여부에 따라 물리 분할/페이지 범위 자동 선택 */
export async function planPdfChunks(
  file: File,
  pagesPerChunk: number = PDF_PAGES_PER_CHUNK,
): Promise<PdfChunk[]> {
  if (file.type !== 'application/pdf') return [{ file, label: file.name }];

  try {
    const { PDFDocument } = await import('pdf-lib');
    const bytes = await file.arrayBuffer();
    try {
      await PDFDocument.load(bytes); // 암호화면 여기서 throw
    } catch {
      // 암호화 PDF → 원본 통짜 + 페이지 범위 지정 청크
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const total = src.getPageCount();
      if (total <= pagesPerChunk) return [{ file, label: file.name }];
      const chunks: PdfChunk[] = [];
      for (let start = 1; start <= total; start += pagesPerChunk) {
        const end = Math.min(start + pagesPerChunk - 1, total);
        chunks.push({ file, pageFrom: start, pageTo: end, label: `p${start}-${end}` });
      }
      return chunks;
    }
    // 일반 PDF → 기존 물리 분할
    const files = await splitPdfIntoChunks(file, pagesPerChunk);
    return files.map((f) => ({ file: f, label: chunkLabel(f) }));
  } catch {
    return [{ file, label: file.name }];
  }
}

/** 실패한 청크를 1페이지 단위로 세분화 (빽빽한 페이지의 출력 한도 대응) */
export async function refinePdfChunk(chunk: PdfChunk): Promise<PdfChunk[]> {
  // 페이지 범위 청크(암호화 PDF): 범위를 1페이지씩 나누기만 하면 됨
  if (chunk.pageFrom != null && chunk.pageTo != null) {
    if (chunk.pageFrom === chunk.pageTo) return [chunk];
    const out: PdfChunk[] = [];
    for (let p = chunk.pageFrom; p <= chunk.pageTo; p++) {
      out.push({ file: chunk.file, pageFrom: p, pageTo: p, label: `p${p}-${p}` });
    }
    return out;
  }
  // 물리 분할 청크: 파일을 1페이지씩 재분할
  const files = await splitPdfIntoChunks(chunk.file, 1);
  return files.map((f) => ({ file: f, label: chunkLabel(f) }));
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
    let baseName = file.name.replace(/\.pdf$/i, '');
    // 이미 분할된 청크(book.p7-9)를 다시 쪼갤 때는 원본 페이지 번호 유지 (p7, p8, p9)
    let pageOffset = 0;
    const prev = baseName.match(/^(.*)\.p(\d+)-(\d+)$/);
    if (prev) {
      baseName = prev[1];
      pageOffset = parseInt(prev[2], 10) - 1;
    }
    for (let start = 0; start < total; start += pagesPerChunk) {
      const end = Math.min(start + pagesPerChunk, total);
      const doc = await PDFDocument.create();
      const pages = await doc.copyPages(src, Array.from({ length: end - start }, (_, i) => start + i));
      for (const p of pages) doc.addPage(p);
      const out = await doc.save();
      chunks.push(
        new File([new Uint8Array(out)], `${baseName}.p${pageOffset + start + 1}-${pageOffset + end}.pdf`, { type: 'application/pdf' }),
      );
    }
    return chunks;
  } catch {
    // 분할 실패(암호화·손상 등) → 통짜로 시도 (서버의 잘림 감지가 안내)
    return [file];
  }
}
