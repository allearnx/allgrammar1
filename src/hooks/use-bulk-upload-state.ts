import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import Papa from 'papaparse';
import { parseQuestions } from '@/components/dashboard/naesin-admin/content-dialogs/problem/bulk-problem-upload-dialog';
import type { NaesinProblemQuestion } from '@/types/naesin';

interface ParsedQuestion {
  number: number;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  type: 'multiple_choice' | 'subjective';
}

export function useBulkUploadState(unitId: string, onAdd: () => void) {
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

      await fetchWithToast('/api/naesin/problems', {
        body: { unitId, title: title.trim(), mode: 'interactive', questions, answerKey, category: 'problem' },
        successMessage: `${preview.length}문제 시트가 추가되었습니다`,
        errorMessage: '일괄 업로드 실패',
        logContext: 'admin.bulk_problem',
      });
      onAdd();
      setOpen(false);
      resetForm();
    } catch { /* fetchWithToast handles toasts/logging */ } finally {
      setSaving(false);
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) resetForm();
  }

  function handleCsvChange(value: string) {
    setCsvText(value);
    setPreview(null);
  }

  const mcqCount = preview?.filter((q) => q.type === 'multiple_choice').length ?? 0;
  const subCount = preview?.filter((q) => q.type === 'subjective').length ?? 0;

  return {
    open,
    title, setTitle,
    csvText,
    preview,
    parseErrors,
    saving,
    guideOpen, setGuideOpen,
    fileInputRef,
    mcqCount,
    subCount,
    handleParse,
    handleFileUpload,
    handleSubmit,
    handleOpenChange,
    handleCsvChange,
  };
}
