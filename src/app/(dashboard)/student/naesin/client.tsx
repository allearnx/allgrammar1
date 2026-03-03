'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  BookMarked,
  CheckCircle,
  Circle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { NaesinTextbook, NaesinStageStatus } from '@/types/database';
import Link from 'next/link';

interface UnitWithProgress {
  id: string;
  unit_number: number;
  title: string;
  sort_order: number;
  hasVocab: boolean;
  hasPassage: boolean;
  hasGrammar: boolean;
  hasOmr: boolean;
  progress: {
    vocab_completed: boolean;
    passage_completed: boolean;
    grammar_completed: boolean;
    omr_completed: boolean;
  } | null;
}

interface NaesinHomeProps {
  textbooks: NaesinTextbook[];
  selectedTextbook: NaesinTextbook | null;
  units: UnitWithProgress[];
}

export function NaesinHome({ textbooks, selectedTextbook, units }: NaesinHomeProps) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(!selectedTextbook);
  const [saving, setSaving] = useState(false);

  async function selectTextbook(textbookId: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textbookId }),
      });
      if (!res.ok) throw new Error();
      toast.success('교과서가 선택되었습니다');
      router.refresh();
      setSelecting(false);
    } catch {
      toast.error('교과서 선택 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  // Textbook selection view
  if (selecting || !selectedTextbook) {
    const gradeTextbooks: Record<number, NaesinTextbook[]> = {};
    textbooks.forEach((tb) => {
      if (!gradeTextbooks[tb.grade]) gradeTextbooks[tb.grade] = [];
      gradeTextbooks[tb.grade].push(tb);
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">교과서 선택</h2>
          <p className="text-muted-foreground mt-1">
            학년과 교과서를 선택하면 내신 대비 학습이 시작됩니다.
          </p>
        </div>

        {textbooks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            등록된 교과서가 없습니다. 관리자에게 문의하세요.
          </p>
        ) : (
          <Tabs defaultValue="1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1">중1</TabsTrigger>
              <TabsTrigger value="2">중2</TabsTrigger>
              <TabsTrigger value="3">중3</TabsTrigger>
            </TabsList>

            {[1, 2, 3].map((grade) => (
              <TabsContent key={grade} value={String(grade)} className="mt-4">
                {gradeTextbooks[grade]?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gradeTextbooks[grade].map((tb) => (
                      <Card
                        key={tb.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => !saving && selectTextbook(tb.id)}
                      >
                        <CardContent className="py-6 text-center">
                          <BookOpen className="h-10 w-10 mx-auto text-primary mb-3" />
                          <p className="font-medium">{tb.display_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{tb.publisher}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    중{grade} 교과서가 아직 등록되지 않았습니다.
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {selectedTextbook && (
          <Button variant="ghost" onClick={() => setSelecting(false)}>
            취소
          </Button>
        )}
      </div>
    );
  }

  // Units list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{selectedTextbook.display_name}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedTextbook.publisher} · 중{selectedTextbook.grade}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSelecting(true)}>
          <RefreshCw className="h-4 w-4 mr-1" />
          교과서 변경
        </Button>
      </div>

      {units.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          등록된 단원이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {units.map((unit) => {
            const stages = calculateStageStatuses(
              unit.progress
                ? {
                    ...unit.progress,
                    id: '',
                    student_id: '',
                    unit_id: unit.id,
                    vocab_flashcard_count: 0,
                    vocab_quiz_score: null,
                    vocab_spelling_score: null,
                    passage_fill_blanks_best: null,
                    passage_ordering_best: null,
                    grammar_video_completed: false,
                    grammar_text_read: false,
                    created_at: '',
                    updated_at: '',
                  }
                : null,
              {
                hasVocab: unit.hasVocab,
                hasPassage: unit.hasPassage,
                hasGrammar: unit.hasGrammar,
                hasOmr: unit.hasOmr,
              }
            );

            const allCompleted =
              stages.vocab === 'completed' &&
              stages.passage === 'completed' &&
              stages.grammar === 'completed' &&
              stages.omr === 'completed';

            return (
              <Link key={unit.id} href={`/student/naesin/${unit.id}`}>
                <Card className="hover:shadow-sm transition-shadow cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold shrink-0">
                        {unit.unit_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium">{unit.title}</h3>
                        <div className="flex gap-1.5 mt-2">
                          <StageBadge label="단어" status={stages.vocab} />
                          <StageBadge label="교과서" status={stages.passage} />
                          <StageBadge label="문법" status={stages.grammar} />
                          <StageBadge label="OMR" status={stages.omr} />
                        </div>
                      </div>
                      {allCompleted && (
                        <Badge className="bg-green-500 text-white shrink-0">완료</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StageBadge({ label, status }: { label: string; status: NaesinStageStatus }) {
  if (status === 'completed') {
    return (
      <Badge variant="outline" className="text-green-600 border-green-300 text-xs gap-1">
        <CheckCircle className="h-3 w-3" />
        {label}
      </Badge>
    );
  }
  if (status === 'locked') {
    return (
      <Badge variant="outline" className="text-muted-foreground border-muted text-xs gap-1">
        <Lock className="h-3 w-3" />
        {label}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs gap-1">
      <Circle className="h-3 w-3" />
      {label}
    </Badge>
  );
}
