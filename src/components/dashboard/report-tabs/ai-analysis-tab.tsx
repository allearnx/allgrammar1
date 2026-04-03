'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Brain, Loader2, Clock } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { PremiumGate } from '@/components/billing/premium-gate';
import { canUseFeature, type Tier } from '@/lib/billing/feature-gate';

interface AiAnalysis {
  id: string;
  analysis: {
    weaknesses?: string[];
    unitSummary?: { unit: string; score: number; status: string }[];
    studyHabit?: string;
    recommendations?: string[];
  };
  created_at: string;
  generated_by: string;
}

type Role = 'teacher' | 'admin' | 'boss' | 'student' | 'parent';

interface Props {
  studentId?: string;
  role: Role;
  tier: Tier;
  token?: string;
}

export function AiAnalysisTab({ studentId, role, tier, token }: Props) {
  const [data, setData] = useState<AiAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const canGenerate = role === 'teacher' || role === 'admin' || role === 'boss';
  const allowed = canUseFeature(tier, 'reports');

  const fetchAnalysis = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (studentId) params.set('studentId', studentId);
      if (token) params.set('token', token);
      const result = await fetchWithToast<AiAnalysis | null>(
        `/api/student/ai-analysis?${params}`,
        { method: 'GET', silent: true },
      );
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [studentId, token]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleGenerate = async () => {
    if (!studentId) return;
    setGenerating(true);
    try {
      const result = await fetchWithToast<AiAnalysis>(
        '/api/student/ai-analysis',
        {
          body: { studentId },
          successMessage: 'AI 분석이 생성되었습니다',
          errorMessage: 'AI 분석 생성 실패',
        },
      );
      setData(result);
    } finally {
      setGenerating(false);
    }
  };

  // Premium gate for free plans
  const content = (
    <div className="space-y-4">
      {/* Generate button (staff only) */}
      {canGenerate && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            학생의 학습 데이터를 AI가 분석합니다
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                AI 분석 생성
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        </div>
      )}

      {/* No data */}
      {!loading && !data && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Brain className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400 font-medium">
            {canGenerate
              ? '아직 AI 분석이 없습니다. 위 버튼으로 생성하세요.'
              : '선생님이 아직 분석을 생성하지 않았습니다.'}
          </p>
        </div>
      )}

      {/* Analysis result */}
      {!loading && data && (
        <div className="space-y-4">
          {/* Weaknesses */}
          {data.analysis.weaknesses && data.analysis.weaknesses.length > 0 && (
            <div className="rounded-xl bg-red-50/70 p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                약점 분석
              </h4>
              <ul className="space-y-1.5">
                {data.analysis.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-red-400 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Unit summary table */}
          {data.analysis.unitSummary && data.analysis.unitSummary.length > 0 && (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">단원</th>
                    <th className="text-center px-4 py-2 font-semibold text-gray-600">성취도</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-600">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.analysis.unitSummary.map((u, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-medium">{u.unit}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          u.score >= 80 ? 'bg-green-100 text-green-800'
                          : u.score >= 60 ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                          {u.score}점
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{u.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Study habit */}
          {data.analysis.studyHabit && (
            <div className="rounded-xl bg-blue-50/70 p-4">
              <h4 className="text-sm font-semibold mb-1 flex items-center gap-1.5 text-blue-800">
                <Clock className="h-4 w-4" />
                학습 습관
              </h4>
              <p className="text-sm text-gray-700">{data.analysis.studyHabit}</p>
            </div>
          )}

          {/* Recommendations */}
          {data.analysis.recommendations && data.analysis.recommendations.length > 0 && (
            <div className="rounded-xl bg-green-50/70 p-4">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-green-800">
                <CheckCircle className="h-4 w-4" />
                추천 학습
              </h4>
              <ul className="space-y-1.5">
                {data.analysis.recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 rounded-full bg-green-400 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generated at */}
          <p className="text-xs text-gray-400 text-right">
            생성일: {new Date(data.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <PremiumGate allowed={allowed} feature="AI 분석" role={role === 'parent' ? 'student' : role}>
      {content}
    </PremiumGate>
  );
}
