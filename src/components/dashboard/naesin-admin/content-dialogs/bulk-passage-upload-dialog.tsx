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
import { Upload, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface ParsedPassage {
  title: string;
  sentences: { original: string; korean: string }[];
}

const PLACEHOLDER = `제목: Lesson 5 본문
He was born in 1990.
그는 1990년에 태어났다.
He went to school in Seoul.
그는 서울에서 학교를 다녔다.
---
제목: Lesson 6 본문
She likes music.
그녀는 음악을 좋아한다.`;

export function parsePassageBlocks(text: string): { passages: ParsedPassage[]; errors: string[] } {
  const blocks = text.trim().split(/^---$/m).map((b) => b.trim()).filter(Boolean);
  const passages: ParsedPassage[] = [];
  const errors: string[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const lines = blocks[bi].split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let title = `지문 ${bi + 1}`;
    let startIdx = 0;

    if (lines[0].startsWith('제목:') || lines[0].startsWith('제목 :')) {
      title = lines[0].replace(/^제목\s*:\s*/, '').trim() || title;
      startIdx = 1;
    }

    const contentLines = lines.slice(startIdx);
    if (contentLines.length < 2) {
      errors.push(`${bi + 1}번째 지문: 최소 1쌍(영어+한국어)이 필요합니다`);
      continue;
    }
    if (contentLines.length % 2 !== 0) {
      errors.push(`${bi + 1}번째 지문 "${title}": 줄 수가 홀수입니다 (영어/한국어 짝이 맞지 않음)`);
    }

    const sentences: { original: string; korean: string }[] = [];
    for (let i = 0; i + 1 < contentLines.length; i += 2) {
      sentences.push({ original: contentLines[i], korean: contentLines[i + 1] });
    }

    if (sentences.length > 0) {
      passages.push({ title, sentences });
    }
  }

  return { passages, errors };
}

function PassagePreviewTable({ passages }: { passages: ParsedPassage[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">제목</th>
            <th className="text-left p-2">문장 수</th>
            <th className="text-left p-2">첫 문장</th>
          </tr>
        </thead>
        <tbody>
          {passages.map((p, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{i + 1}</td>
              <td className="p-2">{p.title}</td>
              <td className="p-2">{p.sentences.length}</td>
              <td className="p-2 text-muted-foreground truncate max-w-[200px]">{p.sentences[0]?.original || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BulkPassageUploadDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedPassage[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);

  function resetForm() {
    setText('');
    setPreview(null);
    setParseErrors([]);
    setProgress('');
  }

  function handleParse() {
    const { passages, errors } = parsePassageBlocks(text);
    setParseErrors(errors);
    if (passages.length === 0) {
      toast.error('유효한 지문이 없습니다');
      setPreview(null);
      return;
    }
    setPreview(passages);
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0) return;
    setSaving(true);
    let successCount = 0;
    const createdIds: string[] = [];

    try {
      for (let i = 0; i < preview.length; i++) {
        const p = preview[i];
        setProgress(`${i + 1}/${preview.length} 저장 중...`);

        const builtSentences = p.sentences.map((s) => ({
          original: s.original,
          korean: s.korean,
          words: s.original.split(/\s+/).filter(Boolean),
        }));
        const originalText = builtSentences.map((s) => s.original).join(' ');
        const koreanTranslation = builtSentences.map((s) => s.korean).join(' ');
        const words = originalText.split(/\s+/);
        const makeBlanks = (interval: number) =>
          words.map((w, wi) => ({ index: wi, answer: w })).filter((_, wi) => wi % interval === interval - 1);

        const result = await fetchWithToast<{ id: string }>('/api/naesin/passages', {
          body: {
            unit_id: unitId,
            title: p.title,
            original_text: originalText,
            korean_translation: koreanTranslation,
            blanks_easy: makeBlanks(5),
            blanks_medium: makeBlanks(3),
            blanks_hard: makeBlanks(2),
            sentences: builtSentences,
            pdf_url: null,
          },
          silent: true,
          logContext: 'admin.bulk_passage',
        });
        createdIds.push(result.id);
        successCount++;
      }

      onAdd();
      setOpen(false);
      resetForm();
      toast.success(`${successCount}개 지문이 추가되었습니다`);

      // Fire-and-forget: grammar/vocab generation for each passage
      if (createdIds.length > 0) {
        toast.info('어법/어휘 문제 백그라운드 생성 중...');
        for (let i = 0; i < preview.length; i++) {
          const p = preview[i];
          const passageId = createdIds[i];
          const builtSentences = p.sentences.map((s) => ({
            original: s.original,
            korean: s.korean,
            words: s.original.split(/\s+/).filter(Boolean),
          }));
          fetch('/api/naesin/passages/extract-grammar-vocab', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sentences: builtSentences }),
          })
            .then(async (gvRes) => {
              if (!gvRes.ok) throw new Error('API error');
              const gvData = await gvRes.json();
              if (gvData.items && gvData.items.length > 0) {
                await fetch('/api/naesin/passages', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: passageId, grammar_vocab_items: gvData.items }),
                });
                onAdd();
              }
            })
            .catch((gvErr) => {
              logger.error('admin.bulk_passage.grammar_vocab', { error: gvErr instanceof Error ? gvErr.message : String(gvErr) });
            });
        }
      }
    } catch (err) {
      if (successCount > 0) {
        toast.warning(`${successCount}/${preview.length}개 저장 완료, 나머지 실패`);
        onAdd();
      }
    } finally {
      setSaving(false);
      setProgress('');
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
          지문 일괄 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>지문 일괄 추가</DialogTitle></DialogHeader>

        <div>
          <Button variant="ghost" size="sm" className="mb-2 text-muted-foreground" onClick={() => setGuideOpen(!guideOpen)}>
            {guideOpen ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
            입력 형식 안내
          </Button>
          {guideOpen && (
            <div className="mb-3 rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">--- 로 지문 구분</p>
              <p className="text-muted-foreground">첫 줄에 <code>제목: ...</code> (선택, 없으면 자동 번호)</p>
              <p className="text-muted-foreground">이후 2줄씩 짝: 영어 → 한국어</p>
              <pre className="text-xs bg-background rounded p-2 overflow-x-auto whitespace-pre-wrap">{PLACEHOLDER}</pre>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="bulk-passage-text">데이터 입력</Label>
            <Textarea
              id="bulk-passage-text"
              value={text}
              onChange={(e) => { setText(e.target.value); setPreview(null); }}
              placeholder={PLACEHOLDER}
              rows={8}
            />
          </div>

          {!preview && (
            <Button type="button" className="w-full" onClick={handleParse} disabled={!text.trim()}>
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
              <PassagePreviewTable passages={preview} />
              <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                {saving ? progress || '저장 중...' : `${preview.length}개 지문 저장`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
