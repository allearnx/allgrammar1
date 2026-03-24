'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bot } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function AddChatQuestionDialog({ lessonId, onAdd }: { lessonId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [grammarConcept, setGrammarConcept] = useState('');
  const [hint, setHint] = useState('');
  const [keywords, setKeywords] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const expectedKeywords = keywords.split(',').map((k) => k.trim()).filter(Boolean);
      const res = await fetch('/api/naesin/grammar/chat/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          questionText,
          grammarConcept: grammarConcept || null,
          hint: hint || null,
          expectedAnswerKeywords: expectedKeywords.length > 0 ? expectedKeywords : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      onAdd();
      setOpen(false);
      setQuestionText('');
      setGrammarConcept('');
      setHint('');
      setKeywords('');
      toast.success('AI 질문이 추가되었습니다');
    } catch (err) {
      logger.error('admin.add_chat_question', { error: err instanceof Error ? err.message : String(err) });
      toast.error('AI 질문 추가 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-6 text-xs px-2">
          <Bot className="h-3 w-3 mr-1" />
          질문 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>AI 문법 튜터 질문 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="chat-q-text">질문</Label>
            <Textarea
              id="chat-q-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="예: 현재진행형은 어떤 상황에서 사용하나요?"
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="chat-q-concept">문법 개념 (선택)</Label>
            <Input
              id="chat-q-concept"
              value={grammarConcept}
              onChange={(e) => setGrammarConcept(e.target.value)}
              placeholder="예: 현재진행형"
            />
          </div>
          <div>
            <Label htmlFor="chat-q-hint">힌트 (선택)</Label>
            <Input
              id="chat-q-hint"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder="예: be동사 + ~ing 형태를 생각해보세요"
            />
          </div>
          <div>
            <Label htmlFor="chat-q-keywords">예상 키워드 (쉼표 구분, 선택)</Label>
            <Input
              id="chat-q-keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="예: be동사, ing, 진행 중"
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
