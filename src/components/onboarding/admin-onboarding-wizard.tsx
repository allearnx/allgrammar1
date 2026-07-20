'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Copy, Check, Rocket, UserPlus, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface AddResult {
  student: { id: string; full_name: string; email: string };
  tempPassword: string;
}

interface Props {
  inviteCode: string;
  /** true = 버튼 클릭으로 열린 경우 (이미 온보딩 완료) */
  autoOpen?: boolean;
  /** 외부에서 닫기 제어 */
  onClose?: () => void;
}

const STEP_CONFIG = {
  1: { title: '학생 추가 가이드', description: '학생 한 명을 바로 등록합니다' },
  2: { title: '학생 추가 완료!', description: '아래 로그인 정보를 학생에게 전달해주세요' },
  3: { title: '초대 코드', description: '나머지 학생은 이 코드로 직접 가입할 수 있어요' },
} as const;

export function AdminOnboardingWizard({ inviteCode, autoOpen, onClose }: Props) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AddResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function handleAddStudent() {
    if (!fullName.trim() || !email.trim()) {
      toast.error('이름과 이메일을 입력해주세요');
      return;
    }
    setSubmitting(true);
    try {
      const data = await fetchWithToast<AddResult>('/api/admin/students/add', {
        body: { full_name: fullName.trim(), email: email.trim() },
        errorMessage: '학생 추가 실패',
        silent: true,
      });
      setResult(data);
      setStep(2);
      toast.success(`${data.student.full_name} 학생이 추가되었습니다`);
      router.refresh();
    } catch (err) {
      toast.error('학생 추가 실패', {
        description: err instanceof Error ? err.message : '알 수 없는 오류',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function copyFullMessage() {
    if (!result) return;
    const msg = `[올라영 로그인 정보]\n이름: ${result.student.full_name}\n이메일: ${result.student.email}\n비밀번호: ${result.tempPassword}\n\nhttps://allgrammar.com 에서 로그인하세요.`;
    navigator.clipboard.writeText(msg);
    setCopiedField('all');
    toast.success('학생에게 전달할 메시지가 복사되었습니다');
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleClose() {
    setOpen(false);
    onClose?.();
    // 온보딩 완료 처리 — 다시 열리지 않도록
    if (!autoOpen) {
      try {
        await fetchWithToast('/api/admin/onboarding-complete', { silent: true, logContext: 'admin.onboarding_close' });
      } catch { /* ignore */ }
      router.refresh();
    }
  }

  async function handleComplete() {
    // 이미 온보딩 완료한 재오픈이면 API 호출 불필요
    if (autoOpen) {
      setOpen(false);
      onClose?.();
      return;
    }
    setSaving(true);
    try {
      await fetchWithToast('/api/admin/onboarding-complete', {
        silent: true,
        logContext: 'admin.onboarding_complete',
      });
      setOpen(false);
      onClose?.();
      router.refresh();
    } catch {
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  const current = STEP_CONFIG[step];
  const StepIcon = step === 1 ? UserPlus : step === 2 ? CheckCircle2 : Rocket;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent
        className="max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => { if (!autoOpen) e.preventDefault(); }}
      >
        {/* Header with step indicator */}
        <div
          className="relative overflow-hidden px-6 pt-5 pb-4 text-white"
          style={{ background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 50%, #174EA6 100%)' }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="h-1 rounded-full transition-all"
                style={{
                  width: s === step ? 32 : 16,
                  background: s <= step ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
            <span className="text-white/50 text-xs ml-auto">{step}/3</span>
          </div>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              <StepIcon className="h-5 w-5" />
              {current.title}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-0.5">
              {current.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-4">
          {/* Step 1: Add first student */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  이름 *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="홍길동"
                  autoFocus
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  이메일 *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@example.com"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && fullName.trim() && email.trim()) handleAddStudent();
                  }}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
                <p className="text-xs text-gray-400">
                  실제 이메일이 아니어도 됩니다. 학생이 로그인할 때 사용합니다.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddStudent}
                  disabled={submitting || !fullName.trim() || !email.trim()}
                  className="flex-1 rounded-[10px] py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: '#1A73E8', boxShadow: '0 4px 12px rgba(26,115,232,0.25)' }}
                >
                  {submitting ? '추가 중...' : '학생 추가'}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="rounded-[10px] border px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  건너뛰기
                </button>
              </div>
            </>
          )}

          {/* Step 2: Show login info */}
          {step === 2 && result && (
            <>
              <div
                className="flex items-center gap-2 rounded-xl p-4"
                style={{ background: 'linear-gradient(120deg, #F0FDF4, #DCFCE7)' }}
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#22C55E' }} />
                <p className="text-sm font-semibold text-gray-800">
                  {result.student.full_name} 학생이 추가되었습니다
                </p>
              </div>

              <div className="rounded-xl border-2 border-brand-200 bg-brand-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                  학생 로그인 정보
                </p>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">이메일</div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-white border px-3 py-2">
                    <code className="text-sm font-mono text-gray-800 break-all">
                      {result.student.email}
                    </code>
                    <button
                      onClick={() => copyText(result.student.email, 'email')}
                      className="shrink-0 text-brand-600 hover:text-brand-800"
                    >
                      {copiedField === 'email' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">임시 비밀번호</div>
                  <div className="flex items-center justify-between gap-2 rounded-lg bg-white border px-3 py-2">
                    <code className="text-base font-mono font-bold text-brand-700 tracking-wider break-all">
                      {result.tempPassword}
                    </code>
                    <button
                      onClick={() => copyText(result.tempPassword, 'password')}
                      className="shrink-0 text-brand-600 hover:text-brand-800"
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={copyFullMessage}
                className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white transition-all"
                style={{ background: '#1A73E8', boxShadow: '0 4px 12px rgba(26,115,232,0.25)' }}
              >
                {copiedField === 'all' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4" /> 복사됨!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Copy className="h-4 w-4" /> 카카오톡 전달용 메시지 복사
                  </span>
                )}
              </button>

              <button
                onClick={() => setStep(3)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-[10px] border py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                다음 <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}

          {/* Step 3: Invite code */}
          {step === 3 && (
            <>
              <div className="flex flex-col items-center gap-4 py-2">
                <div
                  className="rounded-2xl px-8 py-5"
                  style={{ background: 'linear-gradient(120deg, #E8F0FE, #D2E3FC)' }}
                >
                  <code
                    className="text-3xl font-mono font-bold tracking-[0.3em]"
                    style={{ color: '#1A73E8' }}
                  >
                    {inviteCode}
                  </code>
                </div>
                <button
                  onClick={() => copyText(inviteCode, 'invite')}
                  className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white transition-all"
                  style={{ background: '#1A73E8', boxShadow: '0 4px 12px rgba(26,115,232,0.25)' }}
                >
                  {copiedField === 'invite' ? (
                    <Check className="h-3.5 w-3.5 mr-1.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  {copiedField === 'invite' ? '복사됨!' : '코드 복사'}
                </button>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  나머지 학생들은 회원가입 시 이 코드를 입력하면
                  <br />
                  자동으로 학원에 배정됩니다.
                </p>
              </div>

              <button
                onClick={handleComplete}
                disabled={saving}
                className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: '#1A73E8', boxShadow: '0 4px 12px rgba(26,115,232,0.25)' }}
              >
                {saving ? '저장 중...' : '시작하기'}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
