'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, BookOpen, FileText, GraduationCap, ClipboardList, ArrowLeft } from 'lucide-react';
import { VocabTab } from '@/components/naesin/vocab-tab';
import { PassageTab } from '@/components/naesin/passage-tab';
import { GrammarTab } from '@/components/naesin/grammar-tab';
import { OmrTab } from '@/components/naesin/omr-tab';
import type {
  NaesinVocabulary,
  NaesinPassage,
  NaesinGrammarLesson,
  NaesinOmrSheet,
  NaesinStageStatuses,
  NaesinStageStatus,
} from '@/types/database';
import Link from 'next/link';

interface NaesinUnitDetailProps {
  unit: { id: string; unit_number: number; title: string };
  vocabulary: NaesinVocabulary[];
  passages: NaesinPassage[];
  grammarLessons: NaesinGrammarLesson[];
  omrSheets: NaesinOmrSheet[];
  stageStatuses: NaesinStageStatuses;
}

const STAGE_CONFIG = [
  { key: 'vocab' as const, label: '단어 암기', icon: BookOpen },
  { key: 'passage' as const, label: '교과서 암기', icon: FileText },
  { key: 'grammar' as const, label: '문법 설명', icon: GraduationCap },
  { key: 'omr' as const, label: '문제 풀기', icon: ClipboardList },
];

export function NaesinUnitDetail({
  unit,
  vocabulary,
  passages,
  grammarLessons,
  omrSheets,
  stageStatuses,
}: NaesinUnitDetailProps) {
  const router = useRouter();

  // Find the first available (unlocked, not completed) tab, or the first tab
  const firstAvailable = STAGE_CONFIG.find(
    (s) => stageStatuses[s.key] === 'available'
  )?.key || STAGE_CONFIG[0].key;

  const [activeTab, setActiveTab] = useState(firstAvailable);

  function handleStageComplete() {
    router.refresh();
  }

  function handleTabChange(value: string) {
    const stageKey = value as keyof NaesinStageStatuses;
    if (stageStatuses[stageKey] === 'locked') return;
    setActiveTab(stageKey);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/student/naesin">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold">
            Lesson {unit.unit_number}. {unit.title}
          </h2>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          {STAGE_CONFIG.map((stage) => {
            const status = stageStatuses[stage.key];
            return (
              <TabsTrigger
                key={stage.key}
                value={stage.key}
                disabled={status === 'locked'}
                className="gap-1 text-xs sm:text-sm"
              >
                <StageIcon status={status} />
                <span className="hidden sm:inline">{stage.label}</span>
                <span className="sm:hidden">{stage.label.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="vocab" className="mt-4">
          <VocabTab
            vocabulary={vocabulary}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>

        <TabsContent value="passage" className="mt-4">
          <PassageTab
            passages={passages}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>

        <TabsContent value="grammar" className="mt-4">
          <GrammarTab
            lessons={grammarLessons}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>

        <TabsContent value="omr" className="mt-4">
          <OmrTab
            omrSheets={omrSheets}
            unitId={unit.id}
            onStageComplete={handleStageComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StageIcon({ status }: { status: NaesinStageStatus }) {
  if (status === 'completed') return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
  if (status === 'locked') return <Lock className="h-3.5 w-3.5" />;
  return null;
}
