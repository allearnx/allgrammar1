import { useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinPassage } from '@/types/database';

export function usePassagePdf(onUpdate: (updated: NaesinPassage) => void) {
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [quickUploadingId, setQuickUploadingId] = useState<string | null>(null);

  async function quickPdfUpload(passageId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuickUploadingId(passageId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { url } = await fetchWithToast<{ url: string }>('/api/naesin/passages/upload-pdf', {
        body: formData,
        errorMessage: '업로드 실패',
      });
      const updated = await fetchWithToast<NaesinPassage>('/api/naesin/passages', {
        method: 'PATCH',
        body: { id: passageId, pdf_url: url },
        successMessage: 'PDF 업로드 완료',
        errorMessage: '저장 실패',
      });
      onUpdate(updated);
    } catch { /* fetchWithToast handles toasts */ } finally {
      setQuickUploadingId(null);
      e.target.value = '';
    }
  }

  async function removePdf(passageId: string) {
    try {
      const updated = await fetchWithToast<NaesinPassage>('/api/naesin/passages', {
        method: 'PATCH',
        body: { id: passageId, pdf_url: null },
        successMessage: 'PDF가 제거되었습니다',
        errorMessage: 'PDF 제거 실패',
      });
      onUpdate(updated);
    } catch { /* fetchWithToast handles toasts */ }
  }

  async function editPdfUpload(e: React.ChangeEvent<HTMLInputElement>, setEditPdfUrl: (url: string) => void) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await fetchWithToast<{ url: string }>('/api/naesin/passages/upload-pdf', {
        body: formData,
        successMessage: 'PDF 업로드 완료',
        errorMessage: '업로드 실패',
      });
      setEditPdfUrl(data.url);
    } catch { /* fetchWithToast handles toasts */ } finally {
      setUploadingPdf(false);
    }
  }

  return {
    uploadingPdf,
    quickUploadingId,
    quickPdfUpload,
    removePdf,
    editPdfUpload,
  };
}
