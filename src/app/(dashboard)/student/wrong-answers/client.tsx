'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { WrongAnswerCard } from '@/components/naesin/wrong-answer-review';
import type { NaesinWrongAnswer } from '@/types/database';

interface EnrichedWrongAnswer extends NaesinWrongAnswer {
  unit_info?: { unit_number: number; title: string };
  textbook_info?: { id: string; display_name: string } | null;
}

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어',
  passage: '교과서 암기',
  dialogue: '대화문 암기',
  grammar: '문법',
  problem: '문제풀이',
  lastReview: '직전보강',
};

export function WrongAnswersClient() {
  const [wrongAnswers, setWrongAnswers] = useState<EnrichedWrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const loadWrongAnswers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === 'unresolved') params.set('resolved', 'false');
      const data = await fetchWithToast<EnrichedWrongAnswer[]>(`/api/naesin/wrong-answers?${params}`, {
        method: 'GET',
        silent: true,
        logContext: 'wrong_answers_page',
      });
      const items = Array.isArray(data) ? data : [];
      setWrongAnswers(items);
      // Auto-expand all textbook groups
      const groups = new Set(items.map((wa) => wa.textbook_info?.display_name || '기타'));
      setExpandedGroups(groups);
    } catch {
      // silently handled
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadWrongAnswers();
  }, [loadWrongAnswers]);

  async function markResolved(id: string) {
    try {
      await fetchWithToast('/api/naesin/wrong-answers', {
        method: 'PATCH',
        body: { id, resolved: true },
        successMessage: '해결됨으로 표시되었습니다',
        errorMessage: '업데이트 실패',
        logContext: 'wrong_answers_page',
      });
      setWrongAnswers((prev) => prev.filter((wa) => wa.id !== id));
    } catch {
      // error already toasted
    }
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Group: textbook → unit → stage
  type GroupedData = Record<string, Record<string, Record<string, EnrichedWrongAnswer[]>>>;
  const grouped: GroupedData = {};
  for (const wa of wrongAnswers) {
    const tbName = wa.textbook_info?.display_name || '기타';
    const unitKey = wa.unit_info
      ? `${wa.unit_info.unit_number}단원 ${wa.unit_info.title}`
      : wa.unit_id;
    const stageKey = STAGE_LABELS[wa.stage] || wa.stage;
    if (!grouped[tbName]) grouped[tbName] = {};
    if (!grouped[tbName][unitKey]) grouped[tbName][unitKey] = {};
    if (!grouped[tbName][unitKey][stageKey]) grouped[tbName][unitKey][stageKey] = [];
    grouped[tbName][unitKey][stageKey].push(wa);
  }

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">로딩 중...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">전체 오답 ({wrongAnswers.length}개)</span>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filter === 'unresolved' ? 'default' : 'outline'}
            onClick={() => setFilter('unresolved')}
            className="h-7 text-xs"
          >
            미해결
          </Button>
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="h-7 text-xs"
          >
            전체
          </Button>
        </div>
      </div>

      {wrongAnswers.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
          <p className="text-muted-foreground">
            {filter === 'unresolved' ? '미해결 오답이 없습니다!' : '오답이 없습니다!'}
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([tbName, units]) => (
          <div key={tbName} className="border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => toggleGroup(tbName)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted text-left font-medium text-sm"
            >
              {expandedGroups.has(tbName) ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
              {tbName}
              <span className="text-muted-foreground font-normal ml-auto">
                {Object.values(units).reduce(
                  (sum, stages) =>
                    sum + Object.values(stages).reduce((s, items) => s + items.length, 0),
                  0,
                )}개
              </span>
            </button>

            {expandedGroups.has(tbName) && (
              <div className="p-3 space-y-4">
                {Object.entries(units).map(([unitKey, stages]) => (
                  <div key={unitKey}>
                    <p className="text-sm font-medium mb-2">{unitKey}</p>
                    {Object.entries(stages).map(([stageLabel, items]) => (
                      <div key={stageLabel} className="ml-2 mb-3">
                        <p className="text-xs text-muted-foreground mb-1.5">
                          {stageLabel} ({items.length}개)
                        </p>
                        <div className="space-y-2">
                          {items.map((wa) => (
                            <WrongAnswerCard
                              key={wa.id}
                              wrongAnswer={wa}
                              onResolve={() => markResolved(wa.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
