'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Library, ClipboardList, Trash2, Pencil } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { EditTemplateDialog } from './edit-template-dialog';
import type { NaesinProblemQuestion } from '@/types/naesin';

interface TemplateItem {
  id: string;
  title: string;
  questions: NaesinProblemQuestion[];
  template_topic: string;
  category: string;
}

interface TemplateData {
  grouped: Record<string, TemplateItem[]>;
}

interface Props {
  unitId: string;
  onAdd: () => void;
}

export function ImportTemplateDialog({ unitId, onAdd }: Props) {
  const pathname = usePathname();
  const isBoss = pathname.startsWith('/boss/');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grouped, setGrouped] = useState<Record<string, TemplateItem[]>>({});
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

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

  async function handleImport(templateId: string) {
    setCopying(templateId);
    try {
      await fetchWithToast('/api/naesin/templates/import', {
        body: {
          templateId,
          targetUnitIds: [unitId],
        },
        successMessage: '템플릿을 가져왔습니다',
        errorMessage: '템플릿 가져오기 실패',
        logContext: 'import_template.import',
      });
      setOpen(false);
      onAdd();
    } catch {
      // fetchWithToast handles toast
    } finally {
      setCopying(null);
    }
  }

  async function handleDeleteTemplate(templateId: string) {
    if (!window.confirm('이 템플릿을 삭제하시겠습니까?')) return;
    setDeleting(templateId);
    try {
      await fetchWithToast(`/api/naesin/templates?id=${templateId}`, {
        method: 'DELETE',
        successMessage: '템플릿 삭제됨',
        errorMessage: '템플릿 삭제 실패',
        logContext: 'import_template.delete',
      });
      setGrouped((prev) => {
        const next: Record<string, TemplateItem[]> = {};
        for (const [topic, items] of Object.entries(prev)) {
          const filtered = items.filter((t) => t.id !== templateId);
          if (filtered.length > 0) next[topic] = filtered;
        }
        return next;
      });
    } catch {
      // fetchWithToast handles toast
    } finally {
      setDeleting(null);
    }
  }

  const topics = Object.keys(grouped);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Library className="h-3.5 w-3.5" />
            템플릿에서 가져오기
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
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
                  {grouped[activeTopic].map((tmpl) => {
                    const qCount = tmpl.questions?.length || 0;
                    const mcqCount = (tmpl.questions || []).filter(
                      (q) => q.options && q.options.length > 0
                    ).length;
                    const subCount = qCount - mcqCount;

                    return (
                      <div
                        key={tmpl.id}
                        className="flex items-center gap-2 rounded px-3 py-2 hover:bg-muted/50"
                      >
                        <ClipboardList className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span className="text-sm flex-1 truncate">{tmpl.title}</span>
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
                          disabled={copying === tmpl.id}
                          onClick={() => handleImport(tmpl.id)}
                        >
                          {copying === tmpl.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            '가져오기'
                          )}
                        </Button>
                        {isBoss && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingTemplate(tmpl)}
                            aria-label="템플릿 수정"
                            title="템플릿 수정"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {isBoss && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={deleting === tmpl.id}
                            onClick={() => handleDeleteTemplate(tmpl.id)}
                            aria-label="템플릿 삭제"
                            title="템플릿 삭제"
                          >
                            {deleting === tmpl.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={true}
          onOpenChange={(v) => { if (!v) setEditingTemplate(null); }}
          onUpdated={loadTemplates}
        />
      )}
    </>
  );
}
