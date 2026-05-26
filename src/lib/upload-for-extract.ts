import { fetchWithToast } from './fetch-with-toast';

/**
 * PDF를 Supabase Storage에 직접 업로드 (Vercel 4.5MB 본문 제한 우회).
 * 서명된 URL로 업로드하므로 Vercel 서버리스 함수를 거치지 않습니다.
 */
export async function uploadForExtract(file: File): Promise<{ publicUrl: string; storagePath: string }> {
  const { signedUrl, publicUrl, path } = await fetchWithToast<{
    signedUrl: string; publicUrl: string; path: string;
  }>('/api/naesin/get-upload-url', { body: {}, silent: true });

  const res = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('파일 업로드에 실패했습니다. 다시 시도해주세요.');

  return { publicUrl, storagePath: path };
}
