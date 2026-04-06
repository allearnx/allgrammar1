'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Trash2, Download, FileText } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface Material {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_size: number;
  uploaded_by: string;
  academy_id: string | null;
  created_at: string;
}

interface Props {
  initialMaterials: Material[];
  userId: string;
  userRole: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MaterialsClient({ initialMaterials, userId, userRole }: Props) {
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async () => {
    if (!file || !title.trim()) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());

    setUploading(true);
    try {
      const data = await fetchWithToast<Material>('/api/learning-materials', {
        body: formData,
        successMessage: '학습자료가 업로드되었습니다.',
        logContext: 'materials.upload',
      });
      setMaterials((prev) => [data, ...prev]);
      setTitle('');
      setDescription('');
      setFile(null);
    } finally {
      setUploading(false);
    }
  }, [file, title, description]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    await fetchWithToast('/api/learning-materials', {
      method: 'DELETE',
      body: { id },
      successMessage: '삭제되었습니다.',
      logContext: 'materials.delete',
    });
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const canDelete = (m: Material) => userRole === 'boss' || m.uploaded_by === userId;

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-lg">학습자료 업로드</h3>
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="자료 제목을 입력하세요"
              maxLength={200}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="자료에 대한 간단한 설명 (선택)"
              rows={2}
              maxLength={1000}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">PDF 파일 * (최대 20MB)</Label>
            <Input
              id="file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading || !file || !title.trim()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? '업로드 중...' : '업로드'}
          </Button>
        </CardContent>
      </Card>

      {/* Materials List */}
      <div>
        <h3 className="font-semibold text-lg mb-3">업로드된 자료 ({materials.length})</h3>
        {materials.length === 0 ? (
          <p className="text-muted-foreground text-sm">업로드된 학습자료가 없습니다.</p>
        ) : (
          <div className="grid gap-3">
            {materials.map((m) => (
              <Card key={m.id}>
                <CardContent className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="h-8 w-8 text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{m.title}</p>
                      {m.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{m.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(m.created_at)} · {formatFileSize(m.file_size)}
                        {m.academy_id === null && ' · 전체 공개'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    {canDelete(m) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(m.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
