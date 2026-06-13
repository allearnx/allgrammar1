'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface ScanIssue {
  source: 'sheet' | 'template';
  id: string;
  title: string;
  questionNumber: number | null;
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

interface ScanResult {
  rowsScanned: number;
  countsByCategory: { correctness: number; quality: number };
  countsByCode: Record<string, number>;
  issues: ScanIssue[];
}

const QUALITY_LABEL: Record<string, string> = {
  NO_EXPLANATION: '해설 없음',
  NO_FORMAT_HINT: '형식 안내 없음',
  EMPTY_OPTION: '빈 보기',
};

export function ContentScanButton() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function runScan() {
    setLoading(true);
    try {
      const data = await fetchWithToast<ScanResult>('/api/naesin/content-scan', {
        body: {}, // 빈 body라도 application/json으로 보내야 서버 파싱 통과
        errorMessage: '콘텐츠 검사에 실패했습니다',
        logContext: 'naesin.content_scan',
      });
      setResult(data);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  // correctness 이슈를 행(시트/템플릿)별로 그룹핑
  const groups = new Map<string, { title: string; source: string; issues: ScanIssue[] }>();
  for (const i of result?.issues ?? []) {
    const key = `${i.source}:${i.id}`;
    if (!groups.has(key)) groups.set(key, { title: i.title, source: i.source, issues: [] });
    groups.get(key)!.issues.push(i);
  }
  const correctnessCount = result?.countsByCategory.correctness ?? 0;

  return (
    <>
      <Button size="sm" variant="outline" onClick={runScan} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        콘텐츠 검사
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>콘텐츠 검사 결과</DialogTitle>
            <DialogDescription>
              {result
                ? `시트·템플릿 ${result.rowsScanned}개 검사`
                : '검사 중...'}
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-4">
              {/* 요약 */}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  {correctnessCount === 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">진짜 버그 {correctnessCount}건</span>
                </span>
                <span className="text-muted-foreground">
                  품질 경고 {result.countsByCategory.quality}건 (채점 영향 없음)
                </span>
              </div>

              {/* correctness 상세 */}
              {correctnessCount === 0 ? (
                <div className="rounded-md bg-green-50 px-4 py-6 text-center text-sm text-green-800">
                  ✅ 학생 채점에 영향 주는 오류가 없습니다.
                </div>
              ) : (
                <ScrollArea className="max-h-[50vh] pr-3">
                  <div className="space-y-3">
                    {[...groups.values()].map((g, gi) => (
                      <div key={gi} className="rounded-md border p-3">
                        <div className="mb-1.5 flex items-center gap-2">
                          <Badge variant={g.source === 'sheet' ? 'default' : 'secondary'}>
                            {g.source === 'sheet' ? '시트' : '템플릿'}
                          </Badge>
                          <span className="text-sm font-medium">{g.title}</span>
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {g.issues.map((i, ii) => (
                            <li key={ii} className="flex gap-2">
                              <code className="shrink-0 text-xs text-red-600">{i.code}</code>
                              <span>{i.message}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* 품질 카운트 (참고) */}
              {result.countsByCategory.quality > 0 && (
                <div className="border-t pt-3 text-xs text-muted-foreground">
                  품질 경고(참고):{' '}
                  {Object.entries(result.countsByCode)
                    .filter(([code]) => code in QUALITY_LABEL)
                    .map(([code, n]) => `${QUALITY_LABEL[code]} ${n}`)
                    .join(' · ')}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
