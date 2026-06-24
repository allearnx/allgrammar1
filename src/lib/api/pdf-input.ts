import type { NextRequest } from 'next/server';

type DocumentSource =
  | { type: 'base64'; media_type: 'application/pdf'; data: string }
  | { type: 'url'; url: string };

export interface PdfInput {
  documentBlock: { type: 'document'; source: DocumentSource };
  storagePath?: string;
  /** FormData의 file 외 필드 또는 JSON body의 나머지 필드 */
  extraFields: Record<string, string>;
}

/**
 * FormData(파일 직접 전송) 또는 JSON(Storage URL) 입력을 통합 처리.
 * Vercel 4.5MB 본문 제한을 우회하기 위해 두 방식을 모두 지원합니다.
 */
export async function parsePdfInput(request: NextRequest): Promise<PdfInput> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    const { pdfUrl, storagePath, ...rest } = body;
    if (!pdfUrl) throw new Error('pdfUrl이 필요합니다.');
    return {
      documentBlock: { type: 'document', source: { type: 'url', url: pdfUrl } },
      storagePath,
      extraFields: rest,
    };
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('파일이 필요합니다.');

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  const extraFields: Record<string, string> = {};
  formData.forEach((v, k) => { if (k !== 'file' && typeof v === 'string') extraFields[k] = v; });

  return {
    documentBlock: {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf' as const, data: base64 },
    },
    extraFields,
  };
}

// ── PDF + 이미지 통합 입력 ──
type ImageMedia = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
const IMAGE_MEDIA: Record<string, ImageMedia> = {
  'image/png': 'image/png', 'image/jpeg': 'image/jpeg', 'image/jpg': 'image/jpeg',
  'image/webp': 'image/webp', 'image/gif': 'image/gif',
};

export type DocOrImageBlock =
  | { type: 'document'; source: DocumentSource }
  | { type: 'image'; source: { type: 'base64'; media_type: ImageMedia; data: string } | { type: 'url'; url: string } };

export interface DocOrImageInput {
  block: DocOrImageBlock;
  storagePath?: string;
  extraFields: Record<string, string>;
}

/**
 * FormData(파일 직접) 또는 JSON(Storage URL) 입력을 PDF 또는 이미지 블록으로 통합 처리.
 * 이미지(png/jpg/webp/gif)면 image 블록, PDF면 document 블록을 반환한다.
 */
export async function parseDocOrImageInput(request: NextRequest): Promise<DocOrImageInput> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await request.json();
    const { pdfUrl, imageUrl, storagePath, ...rest } = body;
    const url = pdfUrl || imageUrl;
    if (!url) throw new Error('파일 URL이 필요합니다.');
    const block: DocOrImageBlock = imageUrl
      ? { type: 'image', source: { type: 'url', url } }
      : { type: 'document', source: { type: 'url', url } };
    return { block, storagePath, extraFields: rest };
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) throw new Error('파일이 필요합니다.');

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  const extraFields: Record<string, string> = {};
  formData.forEach((v, k) => { if (k !== 'file' && typeof v === 'string') extraFields[k] = v; });

  const media = IMAGE_MEDIA[file.type];
  const block: DocOrImageBlock = media
    ? { type: 'image', source: { type: 'base64', media_type: media, data: base64 } }
    : { type: 'document', source: { type: 'base64', media_type: 'application/pdf' as const, data: base64 } };

  return { block, extraFields };
}

/** 추출 완료 후 Storage 임시 파일 삭제 (실패 무시) */
export async function cleanupStorage(storagePath?: string) {
  if (!storagePath) return;
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    await createAdminClient().storage.from('public-images').remove([storagePath]);
  } catch { /* ignore cleanup errors */ }
}
