'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Library, ClipboardList } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { logger } from '@/lib/logger';
import type { NaesinProblemQuestion } from '@/types/naesin';

interface TemplateSheet {
  id: string;
  title: string;
  questions: NaesinProblemQuestion[];
  template_topic: string | null;
  category: string;
}

interface TemplateData {
  grouped: Record<string, TemplateSheet[]>;
}

interface Props {
  unitId: string;
  onAdd: () => void;
}

export function ImportTemplateDialog({ unitId, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grouped, setGrouped] = useState<Record<string, TemplateSheet[]>>({});
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    loadTemplates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await fetchWithToast<TemplateData>('/api/naesin/templates', {
        method: 'GET',
        errorMessage: '템플릿 목록 불러오기 실패',
        logContext: 'import_template.load',
      });
      setGrouped(data.grouped);
      const topics = Object.keys(data.grouped);
      if (topics.length > 0 && !activeTopic) setActiveTopic(topics[0]);
    } catch {
      // fetchWithToast handles toast
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(sheetId: string) {
    setCopying(sheetId);
    try {
      await fetchWithToast('/api/naesin/problems/copy', {
        body: {
          sourceSheetId: sheetId,
          targetUnitIds: [unitId],
        },
        successMessage: '템플릿을 가져왔습니다',
        errorMessage: '템플릿 가져오기 실패',
        logContext: 'import_template.copy',
      });
      setOpen(false);
      onAdd();
    } catch {
      // fetchWithToast handles toast
    } finally {
      setCopying(null);
    }
  }

  const topics = Object.keys(grouped);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Library className="h-3.5 w-3.5" />
          템플릿에서 가져오기
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            문제 템플릿 라이브러리
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : topics.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            등록된 템플릿이 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {/* Topic tabs */}
            <div className="flex flex-wrap gap-1.5">
              {topics.map((topic) => (
                <Button
                  key={topic}
                  variant={activeTopic === topic ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setActiveTopic(topic)}
                >
                  {topic}
                  <Badge variant="secondary" className="ml-1.5 text-[10px]">
                    {grouped[topic].length}
                  </Badge>
                </Button>
              ))}
            </div>

            {/* Template list */}
            {activeTopic && grouped[activeTopic] && (
              <div className="space-y-1.5 rounded-lg border p-2 max-h-[50vh] overflow-y-auto">
                {grouped[activeTopic].map((sheet) => {
                  const qCount = sheet.questions?.length || 0;
                  const mcqCount = (sheet.questions || []).filter(
                    (q) => q.options && q.options.length > 0
                  ).length;
                  const subCount = qCount - mcqCount;

                  return (
                    <div
                      key={sheet.id}
                      className="flex items-center gap-2 rounded px-3 py-2 hover:bg-muted/50"
                    >
                      <ClipboardList className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="text-sm flex-1 truncate">{sheet.title}</span>
                      <Badge variant="secondary" className="text-[11px]">
                        {qCount}문제
                      </Badge>
                      {mcqCount > 0 && (
                        <Badge variant="outline" className="text-[11px]">
                          객관식 {mcqCount}
                        </Badge>
                      )}
                      {subCount > 0 && (
                        <Badge variant="outline" className="text-[11px]">
                          서술형 {subCount}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={copying === sheet.id}
                        onClick={() => handleImport(sheet.id)}
                      >
                        {copying === sheet.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          '가져오기'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
