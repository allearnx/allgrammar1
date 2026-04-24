'use client';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Library, ClipboardList, Trash2, Pencil } from 'lucide-react';
import { EditTemplateDialog } from './edit-template-dialog';
import { useImportTemplateState } from '@/hooks/use-import-template-state';

interface Props {
  unitId: string;
  onAdd: () => void;
}

export function ImportTemplateDialog({ unitId, onAdd }: Props) {
  const pathname = usePathname();
  const canManageTemplates = pathname.startsWith('/boss/') || pathname.startsWith('/teacher/') || pathname.startsWith('/admin/');

  const {
    open, setOpen,
    loading,
    grouped,
    activeTopic, setActiveTopic,
    copying,
    bulkImporting,
    selectedIds,
    deleting,
    editingTemplate, setEditingTemplate,
    topics,
    loadTemplates,
    toggleSelect,
    handleImport,
    handleBulkImport,
    handleDeleteTemplate,
  } = useImportTemplateState(unitId, onAdd);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Library className="h-3.5 w-3.5" />
            템플릿에서 가져오기
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
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

              {/* Bulk import bar */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                  <span className="text-sm font-medium">{selectedIds.size}개 선택됨</span>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    disabled={bulkImporting}
                    onClick={handleBulkImport}
                  >
                    {bulkImporting ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : null}
                    {selectedIds.size}개 가져오기
                  </Button>
                </div>
              )}

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
                        <Checkbox
                          checked={selectedIds.has(tmpl.id)}
                          onCheckedChange={() => toggleSelect(tmpl.id)}
                          aria-label={`${tmpl.title} 선택`}
                        />
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
                        {canManageTemplates && (
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
                        {canManageTemplates && (
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
