import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';
import type { NaesinTextbook } from '@/types/database';
import { useNaesinHomeData } from './use-naesin-home-data';

const GRADE_COLORS = [
  { accent: '#06B6D4', light: '#ECFEFF', mid: '#CFFAFE', text: '#0891B2' },
  { accent: '#8B5CF6', light: '#F5F3FF', mid: '#EDE9FE', text: '#7C3AED' },
  { accent: '#F59E0B', light: '#FFFBEB', mid: '#FEF3C7', text: '#D97706' },
];

interface TextbookSelectorProps {
  textbooks: NaesinTextbook[];
  onSelect: (tbId: string) => void;
  saving: boolean;
}

export function TextbookSelector({ textbooks, onSelect, saving }: TextbookSelectorProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { gradeTextbooks, publisherColorMap } = useNaesinHomeData(textbooks);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div
        className="relative overflow-hidden rounded-2xl px-5 py-6"
        style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #22D3EE 100%)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-white/90" />
            <h2 className="text-lg font-bold text-white">교과서를 선택하세요</h2>
          </div>
          <p className="text-sm text-white/70">학년과 교과서를 선택하면 내신 대비 학습이 시작됩니다</p>
        </div>
      </div>

      {textbooks.length === 0 ? (
        <div className="flex flex-col items-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
          <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-center text-gray-400 font-medium">
            등록된 교과서가 없습니다
          </p>
          <p className="text-center text-gray-300 text-sm mt-1">관리자에게 문의하세요</p>
        </div>
      ) : (
        <>
          {/* 경고 메시지 */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">교과서는 한 번 선택하면 변경할 수 없습니다</p>
              <p className="text-xs text-amber-600 mt-0.5">변경이 필요한 경우 학원 선생님에게 문의하세요</p>
            </div>
          </div>

          <Tabs defaultValue="1">
            {/* 학년 탭 */}
            <div className="flex gap-2">
              {[1, 2, 3].map((grade, i) => {
                const gc = GRADE_COLORS[i];
                return (
                  <TabsList key={grade} className="bg-transparent p-0">
                    <TabsTrigger
                      value={String(grade)}
                      className="rounded-full px-5 py-2 text-sm font-semibold transition-all data-[state=active]:shadow-sm border"
                      style={{
                        '--tw-border-opacity': '1',
                      } as React.CSSProperties}
                      data-accent={gc.accent}
                      data-light={gc.light}
                    >
                      중{grade}
                    </TabsTrigger>
                  </TabsList>
                );
              })}
            </div>

            {[1, 2, 3].map((grade) => (
              <TabsContent key={grade} value={String(grade)} className="mt-4">
                {gradeTextbooks[grade]?.length ? (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {gradeTextbooks[grade].map((tb) => {
                      const palette = publisherColorMap.get(tb.publisher)!;
                      return (
                        <button
                          key={tb.id}
                          type="button"
                          disabled={saving}
                          onClick={() => setConfirmId(tb.id)}
                          className="group relative flex items-center gap-0 rounded-xl overflow-hidden border border-gray-100 bg-white text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
                        >
                          <div
                            className="w-2.5 self-stretch shrink-0"
                            style={{ background: palette.spine }}
                          />
                          <div
                            className="flex h-full w-12 shrink-0 items-center justify-center"
                            style={{ background: palette.bg }}
                          >
                            <BookOpen className="h-5 w-5" style={{ color: palette.text }} />
                          </div>
                          <div className="min-w-0 flex-1 px-3.5 py-3">
                            <p className="text-sm font-semibold text-gray-800 truncate">{tb.display_name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{tb.publisher}</p>
                          </div>
                          <div className="pr-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-14 rounded-2xl border-2 border-dashed border-gray-200">
                    <BookOpen className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-center text-gray-400 text-sm">
                      중{grade} 교과서가 아직 등록되지 않았습니다
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* 확인 다이얼로그 */}
      {confirmId && (() => {
        const tb = textbooks.find((t) => t.id === confirmId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h3 className="text-base font-bold">교과서 선택 확인</h3>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{tb?.display_name}</span>을(를) 선택하시겠습니까?
              </p>
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                선택 후에는 변경할 수 없습니다. 변경이 필요하면 학원 선생님에게 문의하세요.
              </p>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmId(null)}
                  disabled={saving}
                >
                  취소
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => { onSelect(confirmId); setConfirmId(null); }}
                  disabled={saving}
                >
                  {saving ? '선택 중...' : '선택하기'}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
