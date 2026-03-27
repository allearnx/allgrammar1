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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, ArrowRight, ArrowLeft, Rocket, Phone, Mail, MapPin, BookMarked, BookA } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  inviteCode: string;
  hasContactPhone?: boolean;
}

export function AdminOnboardingWizard({ inviteCode, hasContactPhone }: Props) {
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(hasContactPhone ? 1 : 0);
  const [form, setForm] = useState({
    contact_phone: '',
    contact_email: '',
    address: '',
  });
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const steps = [
    { title: '학원 정보 입력', description: '학원 연락처를 입력해주세요' },
    { title: '초대 코드 확인', description: '학생과 선생님에게 공유하세요' },
    { title: '서비스 안내', description: '이용 가능한 서비스를 확인하세요' },
    { title: '설정 완료', description: '모든 준비가 끝났습니다!' },
  ];

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('초대 코드가 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleComplete() {
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_phone: form.contact_phone || null,
          contact_email: form.contact_email || null,
          address: form.address || null,
        }),
      });

      await fetch('/api/admin/onboarding-complete', { method: 'POST' });

      toast.success('온보딩이 완료되었습니다!');
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
        {/* 상단 그라디언트 헤더 */}
        <div
          className="relative overflow-hidden px-6 pt-6 pb-5 text-white"
          style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              <Rocket className="h-5 w-5" />
              {steps[step].title}
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-0.5">
              {steps[step].description}
            </DialogDescription>
          </DialogHeader>

          {/* 프로그레스 */}
          <div className="relative flex gap-1.5 mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-all"
                style={{ background: i <= step ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="space-y-4">
            {/* Step 1: 학원 정보 */}
            {step === 0 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">연락처</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-10"
                      value={form.contact_phone}
                      onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                      placeholder="02-1234-5678"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">이메일</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      className="pl-10"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      placeholder="admin@academy.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">주소</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-10"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="서울시 강남구..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* Step 2: 초대 코드 */}
            {step === 1 && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div
                  className="rounded-2xl px-8 py-5"
                  style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
                >
                  <code className="text-3xl font-mono font-bold tracking-[0.3em]" style={{ color: '#7C3AED' }}>
                    {inviteCode}
                  </code>
                </div>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white transition-all"
                  style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
                >
                  {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                  {copied ? '복사됨!' : '코드 복사'}
                </button>
                <p className="text-sm text-gray-500 text-center leading-relaxed">
                  학생과 선생님이 회원가입 시 이 코드를 입력하면<br />
                  자동으로 학원에 배정됩니다.
                </p>
              </div>
            )}

            {/* Step 3: 서비스 */}
            {step === 2 && (
              <div className="space-y-3 py-2">
                <div
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
                >
                  <div className="inline-flex rounded-lg bg-white p-2 shrink-0">
                    <BookMarked className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">올인내신</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      내신 대비 문법 학습, 교과서 암기, OMR 문제풀이
                    </p>
                  </div>
                </div>
                <div
                  className="rounded-xl p-4 flex items-start gap-3"
                  style={{ background: 'linear-gradient(120deg, #ECFEFF, #CFFAFE)' }}
                >
                  <div className="inline-flex rounded-lg bg-white p-2 shrink-0">
                    <BookA className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">올킬보카</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      단어 학습, 플래시카드, 퀴즈, 스펠링 테스트
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  학생 관리에서 학생별 서비스를 배정할 수 있습니다.
                </p>
              </div>
            )}

            {/* Step 4: 완료 */}
            {step === 3 && (
              <div className="flex flex-col items-center gap-3 py-6">
                <div
                  className="rounded-full p-4"
                  style={{ background: 'linear-gradient(135deg, #D9F7FC, #CCFAF4)' }}
                >
                  <Check className="h-10 w-10" style={{ color: '#4DD9C0' }} />
                </div>
                <h4 className="text-lg font-bold">준비 완료!</h4>
                <p className="text-center text-sm text-gray-500 leading-relaxed">
                  모든 설정이 완료되었습니다.<br />
                  이제 학생과 선생님을 초대하고 학습을 시작하세요!
                </p>
              </div>
            )}
          </div>

          {/* 네비게이션 */}
          <div className="flex justify-between mt-5">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                이전
              </button>
            ) : (
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                나중에
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center rounded-[10px] px-5 py-2 text-sm font-bold text-white transition-all"
                style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
              >
                다음
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="inline-flex items-center rounded-[10px] px-5 py-2 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
              >
                {saving ? '저장 중...' : '시작하기 →'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
