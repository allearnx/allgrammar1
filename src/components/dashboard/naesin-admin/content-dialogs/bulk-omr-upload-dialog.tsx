'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface ParsedOmrSheet {
  title: string;
  answerKey: string[];
  pdfUrl: string | null;
}

function downloadSampleCsv() {
  const sample = `1과 문제풀이, 3|1|5|2|4, https://example.com/test.pdf
2과 문제풀이, 1|3|2|5|4
3과 문제풀이, 2|4|1|3|5|2|1|3|4|5`;
  const blob = new Blob(['\uFEFF' + sample], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'omr_bulk_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function parseOmrLines(text: string): { sheets: ParsedOmrSheet[]; errors: string[] } {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  const sheets: ParsedOmrSheet[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Split by comma, but only first 3 parts (title, answers, pdfUrl)
    const parts = line.split(',').map((s) => s.trim());

    if (parts.length < 2) {
      errors.push(`${i + 1}번째 줄: 제목과 정답이 필요합니다`);
      continue;
    }

    const title = parts[0];
    if (!title) {
      errors.push(`${i + 1}번째 줄: 제목이 비어있습니다`);
      continue;
    }

    const answerKey = parts[1].split('|').map((s) => s.trim()).filter(Boolean);
    if (answerKey.length === 0) {
      errors.push(`${i + 1}번째 줄: 정답이 비어있습니다`);
      continue;
    }

    const pdfUrl = parts[2] || null;

    sheets.push({ title, answerKey, pdfUrl });
  }

  return { sheets, errors };
}

function OmrPreviewTable({ sheets }: { sheets: ParsedOmrSheet[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">제목</th>
            <th className="text-left p-2">문항수</th>
            <th className="text-left p-2">PDF</th>
          </tr>
        </thead>
        <tbody>
          {sheets.map((s, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{s.title}</td>
              <td className="p-2">{s.answerKey.length}</td>
              <td className="p-2 text-muted-foreground truncate max-w-[150px]">{s.pdfUrl || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BulkOmrUploadDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<ParsedOmrSheet[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  function resetForm() {
    setCsvText('');
    setPreview(null);
    setParseErrors([]);
  }

  function handleParse() {
    const { sheets, errors } = parseOmrLines(csvText);
    setParseErrors(errors);
    if (sheets.length === 0) {
      toast.error('유효한 데이터가 없습니다');
      setPreview(null);
      return;
    }
    setPreview(sheets);
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0) return;
    setSaving(true);
    let successCount = 0;
    try {
      for (const sheet of preview) {
        const res = await fetch('/api/naesin/problems', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unitId,
            title: sheet.title,
            mode: 'image_answer',
            answerKey: sheet.answerKey,
            pdfUrl: sheet.pdfUrl,
            category: 'problem',
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || `"${sheet.title}" 저장 실패`);
        }
        successCount++;
      }
      onAdd();
      setOpen(false);
      resetForm();
      toast.success(`${successCount}개 문제풀이 시트가 추가되었습니다`);
    } catch (err) {
      logger.error('admin.bulk_omr', { error: err instanceof Error ? err.message : String(err) });
      toast.error(err instanceof Error ? err.message : '일괄 업로드 실패');
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-3.5 w-3.5 mr-1" />
          문제풀이 일괄 (OMR)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>문제풀이 일괄 추가 (OMR 모드)</DialogTitle></DialogHeader>

        <div>
          <Button variant="ghost" size="sm" className="mb-2 text-muted-foreground" onClick={() => setGuideOpen(!guideOpen)}>
            {guideOpen ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
            입력 형식 안내
          </Button>
          {guideOpen && (
            <div className="mb-3 rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">한 줄 = 시트 하나</p>
              <p className="text-muted-foreground">형식: <code>제목, 정답(|구분), PDF URL(선택)</code></p>
              <p className="text-muted-foreground">예시:</p>
              <pre className="text-xs bg-background rounded p-2 overflow-x-auto">{`1과 문제풀이, 3|1|5|2|4, https://example.com/test.pdf
2과 문제풀이, 1|3|2|5|4
3과 문제풀이, 2|4|1|3|5|2|1|3|4|5`}</pre>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="omr-bulk-csv">데이터 입력</Label>
              <Button type="button" variant="ghost" size="sm" onClick={downloadSampleCsv}>
                <Download className="h-3.5 w-3.5 mr-1" />
                양식 다운로드
              </Button>
            </div>
            <Textarea
              id="omr-bulk-csv"
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setPreview(null); }}
              placeholder={`1과 문제풀이, 3|1|5|2|4, https://...\n2과 문제풀이, 1|3|2|5|4`}
              rows={6}
            />
          </div>

          {!preview && (
            <Button type="button" className="w-full" onClick={handleParse} disabled={!csvText.trim()}>
              미리보기
            </Button>
          )}

          {parseErrors.length > 0 && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive space-y-1">
              {parseErrors.map((err, i) => <p key={i}>{err}</p>)}
            </div>
          )}

          {preview && preview.length > 0 && (
            <>
              <OmrPreviewTable sheets={preview} />
              <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                {saving ? '저장 중...' : `${preview.length}개 시트 저장`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
