'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Pencil, BookOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinTextbook, NaesinUnit } from '@/types/database';
import { AddTextbookDialog, EditTextbookDialog } from './textbook-dialogs';
import { AddUnitDialog, UnitCard } from './unit-section';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { WorkbookManager } from './workbook-manager';
import { TemplateLibraryClient } from './template-library-client';
import { TextbookExamSection } from './textbook-exam-section';
import { TextbookMaterialsDialog } from './textbook-materials-dialog';
import { logger } from '@/lib/logger';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { gradeLabel } from '@/lib/naesin/grade-label';

interface NaesinAdminClientProps {
  textbooks: NaesinTextbook[];
  unitCounts?: Record<string, number>;
  /** 교과서별 자료(암기 PDF 등) 수 — 목록 배지로 노출해 중복 업로드 방지 */
  materialCounts?: Record<string, number>;
  initialTab?: string;
  canManageContent?: boolean;
}

export function NaesinAdminClient({ textbooks: initialTextbooks, unitCounts: initialUnitCounts, materialCounts: initialMaterialCounts, initialTab, canManageContent = false }: NaesinAdminClientProps) {
  const [textbooks, setTextbooks] = useState(initialTextbooks);
  const [unitCounts, setUnitCounts] = useState<Record<string, number>>(initialUnitCounts ?? {});
  const [materialCounts, setMaterialCounts] = useState<Record<string, number>>(initialMaterialCounts ?? {});
  const [materialsTextbook, setMaterialsTextbook] = useState<NaesinTextbook | null>(null);
  const [gradeFilter, setGradeFilter] = useState<number | null>(
    () => [...initialTextbooks].sort((a, b) => a.grade - b.grade)[0]?.grade ?? null
  );
  const [selectedTextbook, setSelectedTextbook] = useState<NaesinTextbook | null>(null);
  const [units, setUnits] = useState<NaesinUnit[]>([]);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [deleteTextbookId, setDeleteTextbookId] = useState<string | null>(null);
  const [editingTextbook, setEditingTextbook] = useState<NaesinTextbook | null>(null);

  // Load units when textbook selected
  useEffect(() => {
    if (!selectedTextbook) {
      setUnits([]);
      return;
    }
    loadUnits(selectedTextbook.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTextbook?.id]);

  async function loadUnits(textbookId: string) {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('naesin_units')
        .select('id, textbook_id, unit_number, title, sort_order, is_active, created_at')
        .eq('textbook_id', textbookId)
        .order('sort_order');
      setUnits(data || []);
    } catch (err) {
      logger.error('admin.naesin_index', { error: err instanceof Error ? err.message : String(err) });
      toast.error('단원 목록을 불러오지 못했습니다');
    }
  }

  return (
    <Tabs defaultValue={initialTab || 'content'} className="space-y-6">
      <TabsList>
        <TabsTrigger value="content">내신 콘텐츠 관리</TabsTrigger>
        <TabsTrigger value="workbook-omr">교재 OMR 관리</TabsTrigger>
        <TabsTrigger value="templates">문제 템플릿</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">내신 콘텐츠 관리</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                교과서를 선택하면 아래에서 단원과 콘텐츠를 관리합니다
              </p>
            </div>
            <AddTextbookDialog
              onAdd={(tb) => {
                setTextbooks([...textbooks, tb]);
                setGradeFilter(tb.grade);
              }}
            />
          </div>

          {/* Textbook list */}
          {textbooks.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-gray-200 py-12">
              <BookOpen className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">등록된 교과서가 없습니다. 교과서를 추가해주세요.</p>
            </div>
          ) : (
            <>
            {/* 학년 필터 — 중등 파랑 / 고등 초록 */}
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(textbooks.map((t) => t.grade))].sort((a, b) => a - b).map((g) => {
                const count = textbooks.filter((t) => t.grade === g).length;
                const active = gradeFilter === g;
                const activeColor = g >= 4 ? 'bg-[#188038] border-[#188038]' : 'bg-[#1A73E8] border-[#1A73E8]';
                return (
                  <button
                    key={g}
                    type="button"
                    className={`h-8 rounded-full border px-4 text-sm font-semibold transition-colors ${
                      active
                        ? `${activeColor} text-white shadow-sm`
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      setGradeFilter(g);
                      if (selectedTextbook && selectedTextbook.grade !== g) setSelectedTextbook(null);
                    }}
                  >
                    {gradeLabel(g)}
                    <span className={`ml-1.5 text-xs ${active ? 'text-white/70' : 'text-gray-400'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
              {textbooks
                .filter((tb) => gradeFilter === null || tb.grade === gradeFilter)
                .sort((a, b) => a.display_name.localeCompare(b.display_name, 'ko'))
                .map((tb) => {
                const selected = selectedTextbook?.id === tb.id;
                return (
                  <div
                    key={tb.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTextbook(tb)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedTextbook(tb); }}
                    className={`group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      selected ? 'bg-[#E8F0FE] shadow-[inset_3px_0_0_0_#1A73E8]' : 'hover:bg-[#F8F9FA]'
                    } ${tb.is_active ? '' : 'opacity-60'}`}
                  >
                    <p className="w-40 shrink-0 truncate text-sm font-semibold text-gray-800 sm:w-56">{tb.display_name}</p>
                    <p className="hidden min-w-0 flex-1 truncate text-xs text-gray-400 sm:block">
                      {tb.publisher}{tb.is_active ? '' : ' · 비활성'}
                    </p>
                    <span className="ml-auto shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500 sm:ml-0">
                      단원 {unitCounts[tb.id] ?? 0}
                    </span>
                    {(materialCounts[tb.id] ?? 0) > 0 && (
                      <span className="shrink-0 rounded-full bg-[#E8F0FE] px-2.5 py-0.5 text-xs font-medium text-[#174EA6]">
                        자료 {materialCounts[tb.id]}
                      </span>
                    )}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMaterialsTextbook(tb);
                        }}
                        aria-label="교과서 자료 (암기 PDF)"
                        title="자료 (암기 PDF)"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#1A73E8]" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTextbook(tb);
                        }}
                        aria-label="교과서 수정"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTextbookId(tb.id);
                        }}
                        aria-label="교과서 삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}

          {/* Units section */}
          {selectedTextbook && (
            <div className="space-y-3 border-t pt-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{selectedTextbook.display_name}</h3>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                    {gradeLabel(selectedTextbook.grade)}
                  </span>
                  <span className="text-sm text-gray-400">단원 목록</span>
                </div>
                <AddUnitDialog
                  textbookId={selectedTextbook.id}
                  onAdd={(unit) => {
                    setUnits([...units, unit]);
                    setUnitCounts((prev) => ({ ...prev, [selectedTextbook.id]: (prev[selectedTextbook.id] ?? 0) + 1 }));
                  }}
                />
              </div>

              {units.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 text-center">
                  <p className="text-sm text-gray-400">단원이 없습니다. 단원을 추가해주세요.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
                  {units.map((unit) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      expanded={expandedUnit === unit.id}
                      onToggle={() =>
                        setExpandedUnit(expandedUnit === unit.id ? null : unit.id)
                      }
                      onDelete={() => {
                        setUnits(units.filter((u) => u.id !== unit.id));
                        setUnitCounts((prev) => ({ ...prev, [selectedTextbook.id]: Math.max(0, (prev[selectedTextbook.id] ?? 1) - 1) }));
                        toast.success('단원이 삭제되었습니다');
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 시험 대비 섹션 (교과서 레벨) */}
              <TextbookExamSection
                textbookId={selectedTextbook.id}
                textbookName={selectedTextbook.display_name}
                canManageContent={canManageContent}
              />
            </div>
          )}
          <ConfirmDialog
            open={deleteTextbookId !== null}
            onOpenChange={(open) => { if (!open) setDeleteTextbookId(null); }}
            description="이 교과서를 삭제하시겠습니까?"
            onConfirm={async () => {
              const id = deleteTextbookId;
              setDeleteTextbookId(null);
              if (!id) return;
              try {
                await fetchWithToast('/api/naesin/textbooks', {
                  method: 'DELETE',
                  body: { id },
                  successMessage: '교과서가 삭제되었습니다',
                  errorMessage: '교과서 삭제에 실패했습니다',
                  logContext: 'admin.naesin_index',
                });
                setTextbooks(textbooks.filter((t) => t.id !== id));
                if (selectedTextbook?.id === id) setSelectedTextbook(null);
              } catch {
                // fetchWithToast already handles toast + logging
              }
            }}
          />
          {editingTextbook && (
            <EditTextbookDialog
              textbook={editingTextbook}
              open={editingTextbook !== null}
              onOpenChange={(open) => { if (!open) setEditingTextbook(null); }}
              onSave={(updated) => {
                setTextbooks(textbooks.map((t) => (t.id === updated.id ? updated : t)));
                if (selectedTextbook?.id === updated.id) setSelectedTextbook(updated);
              }}
            />
          )}
          <TextbookMaterialsDialog
            textbook={materialsTextbook}
            canManage={canManageContent}
            onClose={() => setMaterialsTextbook(null)}
            onCountChange={(textbookId, count) =>
              setMaterialCounts((prev) => ({ ...prev, [textbookId]: count }))
            }
          />
        </div>
      </TabsContent>

      <TabsContent value="workbook-omr">
        <WorkbookManager />
      </TabsContent>

      <TabsContent value="templates">
        <TemplateLibraryClient />
      </TabsContent>
    </Tabs>
  );
}
