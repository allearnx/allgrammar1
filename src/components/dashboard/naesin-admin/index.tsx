'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinTextbook, NaesinUnit } from '@/types/database';
import { AddTextbookDialog, EditTextbookDialog } from './textbook-dialogs';
import { AddUnitDialog, UnitCard } from './unit-section';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { WorkbookManager } from './workbook-manager';
import { logger } from '@/lib/logger';

interface NaesinAdminClientProps {
  textbooks: NaesinTextbook[];
}

export function NaesinAdminClient({ textbooks: initialTextbooks }: NaesinAdminClientProps) {
  const [textbooks, setTextbooks] = useState(initialTextbooks);
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
        .select('*')
        .eq('textbook_id', textbookId)
        .order('sort_order');
      setUnits(data || []);
    } catch (err) {
      logger.error('admin.naesin_index', { error: err instanceof Error ? err.message : String(err) });
      toast.error('단원 목록을 불러오지 못했습니다');
    }
  }

  return (
    <Tabs defaultValue="content" className="space-y-6">
      <TabsList>
        <TabsTrigger value="content">내신 콘텐츠 관리</TabsTrigger>
        <TabsTrigger value="workbook-omr">교재 OMR 관리</TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">내신 콘텐츠 관리</h2>
            <AddTextbookDialog onAdd={(tb) => setTextbooks([...textbooks, tb])} />
          </div>

          {/* Textbook list */}
          {textbooks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              등록된 교과서가 없습니다. 교과서를 추가해주세요.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {textbooks.map((tb) => (
                <Card
                  key={tb.id}
                  className={`cursor-pointer transition-shadow hover:shadow-md ${
                    selectedTextbook?.id === tb.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedTextbook(tb)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{tb.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          중{tb.grade} · {tb.publisher}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!tb.is_active && (
                          <Badge variant="secondary">비활성</Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTextbook(tb);
                          }}
                          aria-label="교과서 수정"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTextbookId(tb.id);
                          }}
                          aria-label="교과서 삭제"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Units section */}
          {selectedTextbook && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {selectedTextbook.display_name} - 단원 목록
                </h3>
                <AddUnitDialog
                  textbookId={selectedTextbook.id}
                  onAdd={(unit) => setUnits([...units, unit])}
                />
              </div>

              {units.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  단원이 없습니다. 단원을 추가해주세요.
                </p>
              ) : (
                <div className="space-y-2">
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
                        toast.success('단원이 삭제되었습니다');
                      }}
                    />
                  ))}
                </div>
              )}
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
                const res = await fetch('/api/naesin/textbooks', {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id }),
                });
                if (res.ok) {
                  setTextbooks(textbooks.filter((t) => t.id !== id));
                  if (selectedTextbook?.id === id) setSelectedTextbook(null);
                  toast.success('교과서가 삭제되었습니다');
                } else {
                  toast.error('교과서 삭제에 실패했습니다');
                }
              } catch (err) {
                logger.error('admin.naesin_index', { error: err instanceof Error ? err.message : String(err) });
                toast.error('교과서 삭제 중 오류가 발생했습니다');
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
        </div>
      </TabsContent>

      <TabsContent value="workbook-omr">
        <WorkbookManager />
      </TabsContent>
    </Tabs>
  );
}
