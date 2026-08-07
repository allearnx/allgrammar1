'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, Check, Users, Building2, Mail, Phone, MapPin, FileText, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { Academy } from '@/types/user';
import { EXAM_PRESETS, resolveExamIntensity, matchPreset } from '@/lib/voca/exam-intensity';

interface Props {
  academy: Academy;
  currentStudents: number;
  /** 학원 정보(이름·연락처·주소·사업자번호·초대코드) 편집 권한. 선생님은 false → 학습 설정만 */
  canEditAcademyInfo?: boolean;
}

export function AcademySettingsClient({ academy, currentStudents, canEditAcademyInfo = true }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: academy.name || '',
    contact_phone: academy.contact_phone || '',
    contact_email: academy.contact_email || '',
    address: academy.address || '',
    business_number: academy.business_number || '',
    naesin_required_rounds: academy.naesin_required_rounds ?? 1,
  });
  // 표제어 시험 학원 기본 강도 (프리셋 클릭 즉시 저장)
  const [examDefault, setExamDefault] = useState(() =>
    resolveExamIntensity(null, {
      voca_exam_pass_score_default: academy.voca_exam_pass_score_default,
      voca_exam_seconds_per_word_default: academy.voca_exam_seconds_per_word_default,
      voca_exam_retry_wrong_default: academy.voca_exam_retry_wrong_default,
    }),
  );
  const [examSaving, setExamSaving] = useState<string | null>(null);

  async function applyExamDefault(key: string, intensity: { passScore: number; secondsPerWord: number; retryWrong: boolean }) {
    setExamSaving(key);
    try {
      await fetchWithToast('/api/admin/settings', {
        method: 'PATCH',
        body: {
          vocaExamPassScoreDefault: intensity.passScore,
          vocaExamSecondsPerWordDefault: intensity.secondsPerWord,
          vocaExamRetryWrongDefault: intensity.retryWrong,
        },
        successMessage: `표제어 시험 학원 기본: ${EXAM_PRESETS.find((p) => p.key === key)?.label ?? key}`,
        errorMessage: '저장 실패',
      });
      setExamDefault(intensity);
      router.refresh();
    } catch {
      // toasted
    } finally {
      setExamSaving(null);
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(academy.invite_code);
    setCopied(true);
    toast.success('초대 코드가 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await fetchWithToast('/api/admin/settings', {
        method: 'PATCH',
        body: {
          name: form.name || null,
          contact_phone: form.contact_phone || null,
          contact_email: form.contact_email || null,
          address: form.address || null,
          business_number: form.business_number || null,
          naesin_required_rounds: form.naesin_required_rounds,
        },
        successMessage: '설정이 저장되었습니다',
        errorMessage: '저장 실패',
      });
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      setSaving(false);
    }
  }

  const seatPct = academy.max_students
    ? Math.min((currentStudents / academy.max_students) * 100, 100)
    : 0;

  return (
    <div className="max-w-2xl space-y-5">
      {/* 좌석 현황 */}
      {academy.max_students && (
        <div
          className="rounded-xl border bg-white p-5"
          style={{ borderLeftWidth: 4, borderLeftColor: '#06B6D4' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">좌석 현황</span>
            <span style={{ color: '#06B6D4' }}><Users className="h-5 w-5" /></span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight">{currentStudents}</span>
            <span className="text-gray-400 text-sm">/ {academy.max_students}명</span>
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${seatPct}%`,
                background: seatPct >= 90
                  ? '#F43F5E'
                  : 'linear-gradient(to right, #06B6D4, #4DD9C0)',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {seatPct >= 90 ? '좌석이 거의 찼습니다' : `${Math.round(100 - seatPct)}% 여유`}
          </p>
        </div>
      )}

      {/* 초대 코드 — 원장 전용 */}
      {canEditAcademyInfo && (
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 50%, #174EA6 100%)' }}
      >
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/70">초대 코드</span>
          <div className="mt-2 flex items-center gap-3">
            <code className="text-3xl font-mono font-bold tracking-[0.3em]">
              {academy.invite_code}
            </code>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
            >
              {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
          <p className="mt-3 text-sm text-white/70">
            학생과 선생님이 가입할 때 이 코드를 입력하면 학원에 자동 배정됩니다.
          </p>
        </div>
      </div>
      )}

      {/* 학원 정보 / 학습 설정 */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="inline-flex rounded-lg bg-brand-50 p-2">
            <Building2 className="h-5 w-5 text-brand-600" />
          </div>
          <h3 className="font-semibold">{canEditAcademyInfo ? '학원 정보' : '학습 설정'}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {canEditAcademyInfo && (<>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-gray-500">학원 이름</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                className="pl-10"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="올라영어학원"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone" className="text-xs font-semibold uppercase tracking-wider text-gray-500">연락처</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="contact_phone"
                className="pl-10"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="02-1234-5678"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">이메일</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="contact_email"
                type="email"
                className="pl-10"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="admin@academy.com"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-xs font-semibold uppercase tracking-wider text-gray-500">주소</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="address"
                className="pl-10"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="서울시 강남구..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="business_number" className="text-xs font-semibold uppercase tracking-wider text-gray-500">사업자번호</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="business_number"
                className="pl-10"
                value={form.business_number}
                onChange={(e) => setForm({ ...form, business_number: e.target.value })}
                placeholder="000-00-00000"
              />
            </div>
          </div>
          </>)}
          {/* 표제어 시험 학원 기본 강도 */}
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">표제어 시험 기본 강도</p>
            <p className="text-xs text-muted-foreground mb-3">학원 전체 기본값이에요. 학생별로 다르게 하려면 학생 관리에서 개별 설정하세요.</p>
            <div className="flex flex-wrap items-center gap-2">
              {EXAM_PRESETS.map((p) => {
                const active = matchPreset(examDefault) === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    disabled={examSaving !== null}
                    onClick={() => applyExamDefault(p.key, p.intensity)}
                    title={p.hint}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      examSaving === p.key ? 'opacity-50' : ''
                    } ${active ? 'bg-[#FEF7E0] text-[#B06000] font-bold' : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'}`}
                  >
                    {p.label}
                  </button>
                );
              })}
              <span className="text-xs text-muted-foreground">
                합격 {examDefault.passScore}{examDefault.secondsPerWord > 0 ? ` · 단어당 ${examDefault.secondsPerWord}초(긴 단어 자동 연장)` : ' · 무제한'} · 오답재시험 {examDefault.retryWrong ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* 내신 2회독 설정 */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-lg bg-emerald-50 p-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium">교과서/대화문 2회독</p>
                <p className="text-xs text-muted-foreground">학생이 지문과 대화문을 2번 반복 학습합니다</p>
              </div>
            </div>
            <Switch
              checked={form.naesin_required_rounds >= 2}
              onCheckedChange={(checked) =>
                setForm({ ...form, naesin_required_rounds: checked ? 2 : 1 })
              }
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: '#1A73E8', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
          >
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
