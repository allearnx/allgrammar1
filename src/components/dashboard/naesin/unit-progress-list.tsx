import { Layers } from 'lucide-react';
import { isNaesinUnitComplete } from '@/lib/dashboard/naesin-helpers';
import type { NaesinUnit, NaesinStageStatuses } from '@/types/naesin';

interface Props {
  sortedUnits: NaesinUnit[];
  statusesMap: Map<string, NaesinStageStatuses>;
  currentUnitId: string | undefined;
  progressDone: string;
  progressActive: string;
}

export function UnitProgressList({ sortedUnits, statusesMap, currentUnitId, progressDone, progressActive }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5 md:p-6">
      <h3 className="text-base font-bold mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4" />
        단원 진행률
      </h3>
      <div className="space-y-3">
        {sortedUnits.map((unit) => {
          const s = statusesMap.get(unit.id);
          if (!s) return null;
          const done =
            (s.vocab === 'completed' ? 1 : 0) +
            (s.passage === 'completed' ? 1 : 0) +
            (s.dialogue === 'completed' ? 1 : 0) +
            (s.grammar === 'completed' ? 1 : 0) +
            (s.problem === 'completed' ? 1 : 0);
          const pct = Math.round((done / 5) * 100);
          const isDone = isNaesinUnitComplete(s);
          const isActive = currentUnitId === unit.id;

          return (
            <div key={unit.id}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium truncate">{unit.title}</span>
                <span className="text-xs text-gray-400 shrink-0 ml-2">{done}/5</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: isDone
                      ? `linear-gradient(to right, ${progressDone}, #4DD9C0)`
                      : isActive
                        ? progressActive
                        : '#D1D5DB',
                  }}
                />
              </div>
            </div>
          );
        })}
        {sortedUnits.length === 0 && (
          <p className="text-sm text-gray-500">등록된 단원이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
