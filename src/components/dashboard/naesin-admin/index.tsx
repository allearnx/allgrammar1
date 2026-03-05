'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinTextbook, NaesinUnit } from '@/types/database';
import { AddTextbookDialog } from './textbook-dialogs';
import { AddUnitDialog, UnitCard } from './unit-section';

interface NaesinAdminClientProps {
  textbooks: NaesinTextbook[];
}

export function NaesinAdminClient({ textbooks: initialTextbooks }: NaesinAdminClientProps) {
  const [textbooks, setTextbooks] = useState(initialTextbooks);
  const [selectedTextbook, setSelectedTextbook] = useState<NaesinTextbook | null>(null);
  const [units, setUnits] = useState<NaesinUnit[]>([]);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Load units when textbook selected
  useEffect(() => {
    if (!selectedTextbook) {
      setUnits([]);
      return;
    }
    loadUnits(selectedTextbook.id);
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
    } catch {
      toast.error('단원 목록을 불러오지 못했습니다');
    }
  }

  return (
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
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('이 교과서를 삭제하시겠습니까?')) return;
                        try {
                          const res = await fetch('/api/naesin/textbooks', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: tb.id }),
                          });
                          if (res.ok) {
                            setTextbooks(textbooks.filter((t) => t.id !== tb.id));
                            if (selectedTextbook?.id === tb.id) setSelectedTextbook(null);
                            toast.success('교과서가 삭제되었습니다');
                          } else {
                            toast.error('교과서 삭제에 실패했습니다');
                          }
                        } catch {
                          toast.error('교과서 삭제 중 오류가 발생했습니다');
                        }
                      }}
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
    </div>
  );
}
