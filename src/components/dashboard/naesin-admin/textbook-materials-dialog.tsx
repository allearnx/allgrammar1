'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinTextbook } from '@/types/database';
import type { NaesinTextbookMaterial } from '@/types/naesin';

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TextbookMaterialsDialogProps {
  textbook: NaesinTextbook | null;
  canManage: boolean;
  onClose: () => void;
  /** 업로드/삭제 후 목록 배지 갱신용 */
  onCountChange: (textbookId: string, count: number) => void;
}

/**
 * 교과서 자료(단어 암기 PDF 등) 관리 다이얼로그.
 * 목록에 올린 사람·날짜가 보이므로 "다른 선생님이 이미 올렸나?"를 여기서 확인한다.
 */
export function TextbookMaterialsDialog({ textbook, canManage, onClose, onCountChange }: TextbookMaterialsDialogProps) {
  const [materials, setMaterials] = useState<NaesinTextbookMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<NaesinTextbookMaterial | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const textbookId = textbook?.id ?? null;

  const load = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchWithToast<NaesinTextbookMaterial[]>(
        `/api/naesin/textbook-materials?textbookId=${id}`,
        { method: 'GET', silent: true, logContext: 'naesin_admin.textbook_materials' },
      );
      setMaterials(data || []);
    } catch {
      toast.error('자료 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!textbookId) return;
    setMaterials([]);
    setTitle('');
    load(textbookId);
  }, [textbookId, load]);

  async function handleUpload() {
    if (!textbookId) return;
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('PDF 파일을 선택해주세요');
      return;
    }
    if (!title.trim()) {
      toast.error('자료 이름을 입력해주세요 (예: 1과 단어 암기장)');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('textbookId', textbookId);
      formData.append('title', title.trim());
      const res = await fetch('/api/naesin/textbook-materials', { method: 'POST', body: formData });
      const data: NaesinTextbookMaterial & { error?: string } = await res.json();
      if (!res.ok) {
        toast.error(data?.error || '업로드에 실패했습니다');
        return;
      }
      const next = [data, ...materials];
      setMaterials(next);
      onCountChange(textbookId, next.length);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('자료가 업로드되었습니다');
    } catch {
      toast.error('업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(material: NaesinTextbookMaterial) {
    if (!textbookId) return;
    try {
      await fetchWithToast('/api/naesin/textbook-materials', {
        method: 'DELETE',
        body: { id: material.id },
        successMessage: '자료가 삭제되었습니다',
        errorMessage: '삭제에 실패했습니다',
        logContext: 'naesin_admin.textbook_materials',
      });
      const next = materials.filter((m) => m.id !== material.id);
      setMaterials(next);
      onCountChange(textbookId, next.length);
    } catch {
      // toast는 fetchWithToast가 처리
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <Dialog open={!!textbook} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#1A73E8]" />
            교과서 자료 — {textbook?.display_name}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground -mt-2">
          단어 암기 PDF 등을 올리면 이 교과서를 쓰는 학생의 내신 홈에 다운로드 버튼이 생깁니다.
        </p>

        {canManage && (
          <div className="rounded-lg border border-dashed border-gray-300 p-3 space-y-2">
            <Input
              placeholder="자료 이름 (예: 1과 단어 암기장)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
            />
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="flex-1 text-sm file:mr-2 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
                disabled={uploading}
              />
              <Button size="sm" onClick={handleUpload} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span className="ml-1">업로드</span>
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">불러오는 중…</p>
          ) : materials.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">아직 올라온 자료가 없습니다.</p>
          ) : (
            materials.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <FileText className="h-5 w-5 shrink-0 text-red-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.uploaded_by_name || '알 수 없음'} ·{' '}
                    {new Date(m.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ·{' '}
                    {formatFileSize(m.file_size)}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={m.file_url} target="_blank" rel="noopener noreferrer" download>
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                {canManage && (
                  deleteTarget?.id === m.id ? (
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(m)}>
                      확인
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeleteTarget(m)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
