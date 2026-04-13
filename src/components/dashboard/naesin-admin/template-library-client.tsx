'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Loader2, Library, ClipboardList, Trash2, Pencil, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { EditTemplateDialog } from './content-dialogs/edit-template-dialog';
import type { NaesinProblemQuestion } from '@/types/naesin';

interface TemplateItem {
  id: string;
  title: string;
  questions: NaesinProblemQuestion[];
  template_topic: string;
  category: string;
}

export function TemplateLibraryClient() {
  const [loading, setLoading] = useState(true);
  const [grouped, setGrouped] = useState<Record<string, TemplateItem[]>>({});
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);
  const [search, setSearch] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithToast<{ grouped: Record<string, TemplateItem[]> }>(
        '/api/naesin/templates',
        { method: 'GET', silent: true, logContext: 'template_library' }
      );
      setGrouped(data.grouped);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  async function handleDelete(templateId: string) {
    if (!window.confirm('이 템플릿을 삭제하시겠습니까?')) return;
    setDeleting(templateId);
    try {
      await fetchWithToast(`/api/naesin/templates?id=${templateId}`, {
        method: 'DELETE',
        successMessage: '템플릿 삭제됨',
        logContext: 'template_library.delete',
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
      // handled
    } finally {
      setDeleting(null);
    }
  }

  const topics = Object.keys(grouped);
  const totalTemplates = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  // Filter across all topics when searching
  const filteredGrouped = useMemo(() => {
    if (!search) return grouped;
    const q = search.toLowerCase();
    const result: Record<string, TemplateItem[]> = {};
    for (const [topic, items] of Object.entries(grouped)) {
      const categoryLabels: Record<string, string> = { external_passage: '외부지문', eng_eng_def: '영영풀이' };
      const matched = items.filter(
        (t) => t.title.toLowerCase().includes(q) || topic.toLowerCase().includes(q) || (categoryLabels[t.category] || '').includes(q)
      );
      if (matched.length > 0) result[topic] = matched;
    }
    return result;
  }, [grouped, search]);

  const filteredTopics = Object.keys(filteredGrouped);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        <span className="ml-2 text-sm text-gray-500">템플릿 로딩 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Library className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-bold">문제 템플릿 라이브러리</h2>
        <Badge variant="secondary">{totalTemplates}개</Badge>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Library className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">등록된 템플릿이 없습니다</p>
        </div>
      ) : (
        <>
          {/* Global search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="전체 템플릿 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {filteredTopics.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">검색 결과가 없습니다</p>
          ) : (
            <Accordion
              type="multiple"
              defaultValue={search ? filteredTopics : [filteredTopics[0]]}
              key={search}
              className="rounded-lg border"
            >
              {filteredTopics.map((topic) => {
                const items = filteredGrouped[topic];
                const topicQCount = items.reduce((s, t) => s + (t.questions?.length || 0), 0);

                return (
                  <AccordionItem key={topic} value={topic} className="px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{topic}</span>
                        <Badge variant="secondary" className="text-[10px]">{items.length}개</Badge>
                        <span className="text-xs text-muted-foreground">{topicQCount}문제</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1">
                        {items.map((tmpl) => {
                          const qCount = tmpl.questions?.length || 0;
                          const mcqCount = (tmpl.questions || []).filter(
                            (q) => q.options && q.options.length > 0
                          ).length;
                          const subCount = qCount - mcqCount;

                          return (
                            <div
                              key={tmpl.id}
                              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                            >
                              <ClipboardList className="h-4 w-4 text-violet-500 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{tmpl.title}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {tmpl.category === 'external_passage' && (
                                  <Badge className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">외부지문</Badge>
                                )}
                                {tmpl.category === 'eng_eng_def' && (
                                  <Badge className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">영영풀이</Badge>
                                )}
                                <Badge variant="secondary" className="text-xs">{qCount}문제</Badge>
                                {mcqCount > 0 && <Badge variant="outline" className="text-xs">객관식 {mcqCount}</Badge>}
                                {subCount > 0 && <Badge variant="outline" className="text-xs">서술형 {subCount}</Badge>}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => setEditingTemplate(tmpl)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={deleting === tmpl.id}
                                  onClick={() => handleDelete(tmpl.id)}
                                >
                                  {deleting === tmpl.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </>
      )}

      {editingTemplate && (
        <EditTemplateDialog
          template={editingTemplate}
          open={true}
          onOpenChange={(v) => { if (!v) setEditingTemplate(null); }}
          onUpdated={loadTemplates}
        />
      )}
    </div>
  );
}
