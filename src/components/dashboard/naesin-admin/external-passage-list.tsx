'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText, PlayCircle, ChevronDown, ChevronRight, Pencil, Check, X, Trash2, Loader2, ArrowUp, ArrowDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { SHEET_ADMIN_LITE_COLUMNS, type NaesinProblemSheet, type ExternalPassageSentence } from '@/types/naesin';

interface Row {
  original: string;
  korean: string;
}

function toRows(sheet: NaesinProblemSheet): Row[] {
  return ((sheet.questions ?? []) as unknown as ExternalPassageSentence[])
    .map((q) => ({ original: q.original ?? '', korean: q.korean ?? '' }));
}

/** 편집 행 → 저장 형식. 만들기 다이얼로그와 동일하게 words·acceptedAnswers는 원문에서 다시 만든다. */
function toQuestions(rows: Row[]): ExternalPassageSentence[] {
  return rows.map((s, i) => {
    const original = s.original.trim();
    return {
      number: i + 1,
      original,
      korean: s.korean.trim(),
      words: original.split(/\s+/),
      acceptedAnswers: [original.replace(/[.!?]$/, '').trim()],
    };
  });
}

interface ExternalPassageListProps {
  sheets: NaesinProblemSheet[];
  onUpdate: (sheet: NaesinProblemSheet) => void;
  onRequestDelete: (id: string) => void;
}

/**
 * 외부지문 시트 목록 — 클릭하면 문장(영어/한국어)을 펼쳐 보고 그 자리에서 고친다.
 * (2026-09-23: 제목·삭제만 있던 목록이라 "넣었는데 내용을 볼 수 없다"는 사장님 신고로 추가)
 */
export function ExternalPassageList({ sheets, onUpdate, onRequestDelete }: ExternalPassageListProps) {
  return (
    <div className="space-y-1">
      {sheets.map((sheet) => (
        <ExternalPassageItem key={sheet.id} sheet={sheet} onUpdate={onUpdate} onRequestDelete={onRequestDelete} />
      ))}
    </div>
  );
}

function ExternalPassageItem({ sheet, onUpdate, onRequestDelete }: { sheet: NaesinProblemSheet } & Omit<ExternalPassageListProps, 'sheets'>) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [title, setTitle] = useState(sheet.title);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState<Row>({ original: '', korean: '' });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const count = rows?.length ?? sheet.answer_key?.length ?? sheet.questions?.length ?? 0;

  async function toggle() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (rows) return;
    if (Array.isArray(sheet.questions) && sheet.questions.length > 0) {
      setRows(toRows(sheet));
      return;
    }
    // 목록은 lite 컬럼만 실어 오므로 펼칠 때 questions만 따로 읽는다 (loadFullSheet와 같은 경로)
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const { data, error } = await createClient()
        .from('naesin_problem_sheets')
        .select(SHEET_ADMIN_LITE_COLUMNS + ', questions')
        .eq('id', sheet.id)
        .single();
      if (error || !data) {
        toast.error('문장을 불러오지 못했습니다');
        return;
      }
      setRows(toRows(data as unknown as NaesinProblemSheet));
    } finally {
      setLoading(false);
    }
  }

  function updateRows(next: Row[]) {
    setRows(next);
    setDirty(true);
  }

  function startEdit(i: number) {
    if (!rows) return;
    setEditingIdx(i);
    setDraft(rows[i]);
  }

  function commitEdit() {
    if (!rows || editingIdx === null) return;
    updateRows(rows.map((r, i) => (i === editingIdx ? { ...draft } : r)));
    setEditingIdx(null);
  }

  function move(i: number, dir: -1 | 1) {
    if (!rows) return;
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    updateRows(next);
  }

  async function save() {
    if (!rows) return;
    const cleaned = rows.filter((r) => r.original.trim());
    if (cleaned.length === 0) {
      toast.error('문장이 하나 이상 있어야 합니다');
      return;
    }
    setSaving(true);
    try {
      const questions = toQuestions(cleaned);
      const updated = await fetchWithToast<NaesinProblemSheet>('/api/naesin/problems', {
        method: 'PATCH',
        body: { id: sheet.id, title: title.trim() || sheet.title, questions, answer_key: questions.map((q) => q.original) },
        successMessage: '외부지문이 저장되었습니다',
        errorMessage: '외부지문 저장 실패',
        logContext: 'unit.update_external_passage',
      });
      setRows(toRows(updated));
      setDirty(false);
      setEditingIdx(null);
      onUpdate(updated);
    } catch {
      /* fetchWithToast handles toasts */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border">
      <div
        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50 cursor-pointer"
        onClick={toggle}
      >
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
          <FileText className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm truncate">{sheet.title}</span>
          <span className="text-xs text-gray-400 shrink-0">{count}문장</span>
          {sheet.video_url && <PlayCircle className="h-3.5 w-3.5 text-cyan-500 shrink-0" aria-label="설명 영상 있음" />}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500 hover:text-red-700 h-7 px-2"
          onClick={(e) => { e.stopPropagation(); onRequestDelete(sheet.id); }}
        >
          삭제
        </Button>
      </div>

      {expanded && (
        <div className="px-2 pb-3 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />문장을 불러오는 중...
            </div>
          ) : rows && (
            <>
              <Input
                className="h-8 text-sm"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                placeholder="시트 제목"
              />
              <div className="rounded-lg border overflow-hidden max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 w-8">#</th>
                      <th className="text-left p-2">영어</th>
                      <th className="text-left p-2">한국어</th>
                      <th className="text-left p-2 w-28">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t align-top">
                        <td className="p-2 text-muted-foreground">{i + 1}</td>
                        {editingIdx === i ? (
                          <>
                            <td className="p-2">
                              <Textarea value={draft.original} onChange={(e) => setDraft((d) => ({ ...d, original: e.target.value }))} rows={2} className="text-xs" />
                            </td>
                            <td className="p-2">
                              <Textarea value={draft.korean} onChange={(e) => setDraft((d) => ({ ...d, korean: e.target.value }))} rows={2} className="text-xs" />
                            </td>
                            <td className="p-2">
                              <div className="flex gap-0.5">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={commitEdit} aria-label="적용">
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingIdx(null)} aria-label="취소">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 text-xs">{r.original}</td>
                            <td className="p-2 text-xs text-muted-foreground">{r.korean}</td>
                            <td className="p-2">
                              <div className="flex gap-0.5">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="아래로">
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => startEdit(i)} aria-label="편집">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => updateRows(rows.filter((_, k) => k !== i))} aria-label="삭제">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {rows.length}문장 · 영어 원문을 고치면 순서배열·영작 정답도 함께 바뀝니다
                </span>
                <Button size="sm" className="h-7" onClick={save} disabled={!dirty || saving}>
                  {saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
