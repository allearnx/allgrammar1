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
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface ParsedDialogue {
  title: string;
  sentences: { original: string; korean: string; speaker?: string }[];
}

const PLACEHOLDER = `제목: Lesson 5 대화문
A: Hello, how are you?
안녕, 어떻게 지내?
B: I'm fine, thank you.
잘 지내, 고마워.
---
제목: Lesson 6 대화문
A: What time is it?
몇 시야?
B: It's three o'clock.
3시야.`;

/** "A: Hello" → { speaker: "A", text: "Hello" }, "Hello" → { speaker: undefined, text: "Hello" } */
function parseSpeaker(line: string): { speaker?: string; text: string } {
  const match = line.match(/^([A-Za-z가-힣]+)\s*:\s+(.+)$/);
  if (match) return { speaker: match[1], text: match[2] };
  return { text: line };
}

export function parseDialogueBlocks(text: string): { dialogues: ParsedDialogue[]; errors: string[] } {
  const blocks = text.trim().split(/^---$/m).map((b) => b.trim()).filter(Boolean);
  const dialogues: ParsedDialogue[] = [];
  const errors: string[] = [];

  for (let bi = 0; bi < blocks.length; bi++) {
    const lines = blocks[bi].split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let title = `대화문 ${bi + 1}`;
    let startIdx = 0;

    if (lines[0].startsWith('제목:') || lines[0].startsWith('제목 :')) {
      title = lines[0].replace(/^제목\s*:\s*/, '').trim() || title;
      startIdx = 1;
    }

    const contentLines = lines.slice(startIdx);
    if (contentLines.length < 2) {
      errors.push(`${bi + 1}번째 대화문: 최소 1쌍(영어+한국어)이 필요합니다`);
      continue;
    }
    if (contentLines.length % 2 !== 0) {
      errors.push(`${bi + 1}번째 대화문 "${title}": 줄 수가 홀수입니다 (영어/한국어 짝이 맞지 않음)`);
    }

    const sentences: { original: string; korean: string; speaker?: string }[] = [];
    for (let i = 0; i + 1 < contentLines.length; i += 2) {
      const { speaker, text: originalText } = parseSpeaker(contentLines[i]);
      sentences.push({
        original: originalText,
        korean: contentLines[i + 1],
        ...(speaker ? { speaker } : {}),
      });
    }

    if (sentences.length > 0) {
      dialogues.push({ title, sentences });
    }
  }

  return { dialogues, errors };
}

function DialoguePreviewTable({ dialogues }: { dialogues: ParsedDialogue[] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">제목</th>
            <th className="text-left p-2">문장 수</th>
            <th className="text-left p-2">화자</th>
          </tr>
        </thead>
        <tbody>
          {dialogues.map((d, i) => {
            const speakers = [...new Set(d.sentences.map((s) => s.speaker).filter(Boolean))];
            return (
              <tr key={i} className="border-t">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">{d.title}</td>
                <td className="p-2">{d.sentences.length}</td>
                <td className="p-2 text-muted-foreground">{speakers.length > 0 ? speakers.join(', ') : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function BulkDialogueUploadDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedDialogue[] | null>(null);
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
    const { dialogues, errors } = parseDialogueBlocks(text);
    setParseErrors(errors);
    if (dialogues.length === 0) {
      toast.error('유효한 대화문이 없습니다');
      setPreview(null);
      return;
    }
    setPreview(dialogues);
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0) return;
    setSaving(true);
    let successCount = 0;

    try {
      for (let i = 0; i < preview.length; i++) {
        const d = preview[i];
        setProgress(`${i + 1}/${preview.length} 저장 중...`);

        const builtSentences = d.sentences.map((s) => ({
          original: s.original,
          korean: s.korean,
          ...(s.speaker ? { speaker: s.speaker } : {}),
        }));

        await fetchWithToast('/api/naesin/dialogues', {
          body: { unit_id: unitId, title: d.title, sentences: builtSentences },
          silent: true,
          logContext: 'admin.bulk_dialogue',
        });
        successCount++;
      }

      onAdd();
      setOpen(false);
      resetForm();
      toast.success(`${successCount}개 대화문이 추가되었습니다`);
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
          대화문 일괄 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>대화문 일괄 추가</DialogTitle></DialogHeader>

        <div>
          <Button variant="ghost" size="sm" className="mb-2 text-muted-foreground" onClick={() => setGuideOpen(!guideOpen)}>
            {guideOpen ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
            입력 형식 안내
          </Button>
          {guideOpen && (
            <div className="mb-3 rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">--- 로 대화문 구분</p>
              <p className="text-muted-foreground">첫 줄에 <code>제목: ...</code> (선택, 없으면 자동 번호)</p>
              <p className="text-muted-foreground">2줄씩 짝: 영어 → 한국어</p>
              <p className="text-muted-foreground">영어 줄에 <code>A: </code> 같은 화자 접두사 자동 감지</p>
              <pre className="text-xs bg-background rounded p-2 overflow-x-auto whitespace-pre-wrap">{PLACEHOLDER}</pre>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="bulk-dialogue-text">데이터 입력</Label>
            <Textarea
              id="bulk-dialogue-text"
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
              <DialoguePreviewTable dialogues={preview} />
              <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                {saving ? progress || '저장 중...' : `${preview.length}개 대화문 저장`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
