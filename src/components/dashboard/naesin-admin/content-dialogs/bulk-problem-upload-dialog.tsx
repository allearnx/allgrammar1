'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, Download, ChevronDown, ChevronRight, FileUp } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import type { NaesinProblemQuestion } from '@/types/naesin';

interface ParsedQuestion {
  number: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  type: 'multiple_choice' | 'subjective';
}

function downloadSampleCsv() {
  const header = '번호,문제,보기1,보기2,보기3,보기4,보기5,정답,해설';
  const rows = [
    '1,Choose the correct form.,has gone,have gone,had gone,is going,was going,1,현재완료 have/has + p.p.',
    '2,Which is grammatically correct?,She don\'t like it,She doesn\'t like it,She not like it,She no like it,,2,3인칭 단수 주어는 doesn\'t',
    '3,빈칸에 알맞은 단어를 쓰시오.,,,,,,running,현재분사 -ing 형태',
  ];
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'problem_bulk_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function parseQuestions(data: string[][]): { questions: ParsedQuestion[]; errors: string[] } {
  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    // Skip empty rows or header
    if (!row || row.length < 2) continue;
    const first = (row[0] || '').trim();
    if (!first || first === '번호' || first === '#') continue;

    const number = Number(first);
    if (isNaN(number)) {
      errors.push(`${i + 1}행: 번호가 올바르지 않습니다 ("${first}")`);
      continue;
    }

    const question = (row[1] || '').trim();
    if (!question) {
      errors.push(`${i + 1}행: 문제 텍스트가 비어있습니다`);
      continue;
    }

    const choices = [row[2], row[3], row[4], row[5], row[6]]
      .map((s) => (s || '').trim())
      .filter(Boolean);

    const answer = (row[7] || '').trim();
    if (!answer) {
      errors.push(`${i + 1}행: 정답이 비어있습니다`);
      continue;
    }

    const explanation = (row[8] || '').trim();
    const isSubjective = choices.length === 0;

    if (!isSubjective) {
      const answerNum = Number(answer);
      if (isNaN(answerNum) || answerNum < 1 || answerNum > choices.length) {
        errors.push(`${i + 1}행: 정답 번호(${answer})가 보기 수(${choices.length})를 초과합니다`);
        continue;
      }
    }

    questions.push({
      number,
      question,
      options: choices,
      answer,
      explanation,
      type: isSubjective ? 'subjective' : 'multiple_choice',
    });
  }

  return { questions, errors };
}

function QuestionPreviewTable({ questions }: { questions: ParsedQuestion[] }) {
  return (
    <div className="rounded-lg border overflow-hidden max-h-[300px] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 sticky top-0">
          <tr>
            <th className="text-left p-2">#</th>
            <th className="text-left p-2">문제</th>
            <th className="text-left p-2">유형</th>
            <th className="text-left p-2">정답</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">{q.number}</td>
              <td className="p-2 max-w-[250px] truncate">{q.question}</td>
              <td className="p-2">
                <Badge variant={q.type === 'subjective' ? 'secondary' : 'outline'} className="text-xs">
                  {q.type === 'subjective' ? '서술형' : `객관식(${q.options.length})`}
                </Badge>
              </td>
              <td className="p-2">
                {q.type === 'multiple_choice' ? `${q.answer}번` : q.answer}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BulkProblemUploadDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState<ParsedQuestion[] | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setTitle('');
    setCsvText('');
    setPreview(null);
    setParseErrors([]);
  }

  function processCsvData(text: string) {
    const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
    const { questions, errors } = parseQuestions(result.data);
    setParseErrors(errors);
    if (questions.length === 0) {
      toast.error('유효한 문제가 없습니다');
      setPreview(null);
      return;
    }
    setPreview(questions);
  }

  function handleParse() {
    processCsvData(csvText);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      processCsvData(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleSubmit() {
    if (!preview || preview.length === 0 || !title.trim()) return;
    setSaving(true);
    try {
      const questions: NaesinProblemQuestion[] = preview.map((q) => ({
        number: q.number,
        question: q.question,
        ...(q.options.length > 0 ? { options: q.options } : {}),
        answer: q.answer,
        ...(q.explanation ? { explanation: q.explanation } : {}),
      }));

      const answerKey = preview.map((q) => q.answer);

      const res = await fetch('/api/naesin/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          title: title.trim(),
          mode: 'interactive',
          questions,
          answerKey,
          category: 'problem',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      onAdd();
      setOpen(false);
      resetForm();
      toast.success(`${preview.length}문제 시트가 추가되었습니다`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : '일괄 업로드 실패');
    } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetForm();
  }

  const mcqCount = preview?.filter((q) => q.type === 'multiple_choice').length ?? 0;
  const subCount = preview?.filter((q) => q.type === 'subjective').length ?? 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-3.5 w-3.5 mr-1" />
          문제풀이 일괄 (직접입력)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>문제풀이 일괄 추가 (직접 입력 모드)</DialogTitle></DialogHeader>

        <div>
          <Button variant="ghost" size="sm" className="mb-2 text-muted-foreground" onClick={() => setGuideOpen(!guideOpen)}>
            {guideOpen ? <ChevronDown className="h-3.5 w-3.5 mr-1" /> : <ChevronRight className="h-3.5 w-3.5 mr-1" />}
            입력 형식 안내
          </Button>
          {guideOpen && (
            <div className="mb-3 rounded-lg bg-muted/50 p-3 text-sm space-y-1">
              <p className="font-medium">한 줄 = 문제 하나 (하나의 시트로 묶임)</p>
              <p className="text-muted-foreground">형식: <code>번호, 문제, 보기1, 보기2, 보기3, 보기4, 보기5, 정답, 해설</code></p>
              <p className="text-muted-foreground">보기가 모두 비어있으면 서술형으로 처리됩니다.</p>
              <pre className="text-xs bg-background rounded p-2 overflow-x-auto">{`번호,문제,보기1,보기2,보기3,보기4,보기5,정답,해설
1,Choose the correct form.,has gone,have gone,had gone,is going,was going,1,현재완료
2,빈칸에 알맞은 단어를 쓰시오.,,,,,,running,현재분사`}</pre>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label htmlFor="problem-bulk-title">시트 제목</Label>
            <Input
              id="problem-bulk-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="1과 문제풀이"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="problem-bulk-csv">문제 데이터</Label>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="h-3.5 w-3.5 mr-1" />
                  CSV 파일
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={downloadSampleCsv}>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  양식
                </Button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Textarea
              id="problem-bulk-csv"
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setPreview(null); }}
              placeholder={`번호,문제,보기1,보기2,보기3,보기4,보기5,정답,해설\n1,Choose the correct form.,has gone,have gone,...,1,현재완료`}
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
              <div className="flex gap-2 text-sm">
                <Badge variant="secondary">총 {preview.length}문제</Badge>
                {mcqCount > 0 && <Badge variant="outline">객관식 {mcqCount}</Badge>}
                {subCount > 0 && <Badge variant="outline">서술형 {subCount}</Badge>}
              </div>
              <QuestionPreviewTable questions={preview} />
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={saving || !title.trim()}
              >
                {saving ? '저장 중...' : `${preview.length}문제 시트 저장`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
