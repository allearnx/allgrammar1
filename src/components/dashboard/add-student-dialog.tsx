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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Copy, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface AddResult {
  student: { id: string; full_name: string; email: string };
  tempPassword: string;
}

interface Props {
  /** 빈 상태 CTA용: 다른 버튼 스타일/텍스트 제공 */
  variant?: 'primary' | 'cta';
  label?: string;
}

export function AddStudentDialog({ variant = 'primary', label = '학생 추가' }: Props) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AddResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const router = useRouter();

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  async function handleSubmit() {
    if (!fullName.trim() || !email.trim()) {
      toast.error('이름과 이메일을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const data = await fetchWithToast<AddResult>('/api/admin/students/add', {
        body: {
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          services: services.length > 0 ? services : undefined,
        },
        errorMessage: '학생 추가 실패',
        silent: true,
      });

      setResult(data);
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

  function copyToClipboard(text: string, field: string) {
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

  function handleClose(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      // 닫을 때 초기화 (다음 추가를 위해)
      setFullName('');
      setEmail('');
      setPhone('');
      setServices([]);
      setResult(null);
      setCopiedField(null);
    }
  }

  const buttonClass =
    variant === 'cta'
      ? 'inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition-all'
      : 'inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold text-white transition-all hover:shadow-md';

  const buttonStyle = {
    background: '#1A73E8',
    boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonClass} style={buttonStyle}>
        <UserPlus className={variant === 'cta' ? 'h-5 w-5' : 'h-4 w-4 mr-1.5'} />
        {label}
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div
            className="px-6 pt-5 pb-4 text-white"
            style={{ background: 'linear-gradient(135deg, #4285F4 0%, #1A73E8 50%, #174EA6 100%)' }}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <UserPlus className="h-5 w-5" />
                {result ? '학생 추가 완료' : '학생 추가'}
              </DialogTitle>
              <DialogDescription className="text-white/70 text-sm mt-0.5">
                {result
                  ? '아래 로그인 정보를 학생에게 전달해주세요'
                  : '학생 한 명을 바로 등록합니다'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 pt-5 space-y-4">
            {!result ? (
              <>
                {/* 입력 폼 */}
                <div className="space-y-2">
                  <Label htmlFor="add-student-name" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    이름 *
                  </Label>
                  <input
                    id="add-student-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="홍길동"
                    autoFocus
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-student-email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    이메일 *
                  </Label>
                  <input
                    id="add-student-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                  <p className="text-xs text-gray-400">실제 이메일이 아니어도 됩니다. 학생이 로그인할 때 사용합니다.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="add-student-phone" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    전화번호 (선택)
                  </Label>
                  <input
                    id="add-student-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="010-1234-5678"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    서비스 배정 (선택)
                  </Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={services.includes('naesin')}
                        onCheckedChange={() => toggleService('naesin')}
                      />
                      올인내신
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={services.includes('voca')}
                        onCheckedChange={() => toggleService('voca')}
                      />
                      올킬보카
                    </label>
                  </div>
                </div>

                {/* 주의사항 */}
                <div
                  className="flex gap-2 rounded-xl p-3 text-xs text-gray-600"
                  style={{ background: 'linear-gradient(120deg, #FEFCE8, #FEF9C3)' }}
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#CA8A04' }} />
                  <p>임시 비밀번호가 생성됩니다. 학생에게 이메일과 함께 전달해주세요.</p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !fullName.trim() || !email.trim()}
                  className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                  style={{ background: '#1A73E8', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
                >
                  {submitting ? '추가 중...' : '학생 추가'}
                </button>
              </>
            ) : (
              <>
                {/* 결과 화면 */}
                <div
                  className="flex items-center gap-2 rounded-xl p-4"
                  style={{ background: 'linear-gradient(120deg, #F0FDF4, #DCFCE7)' }}
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#22C55E' }} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{result.student.full_name} 학생이 추가되었습니다</p>
                  </div>
                </div>

                {/* 로그인 정보 박스 */}
                <div className="rounded-xl border-2 border-brand-200 bg-brand-50/30 p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
                    학생 로그인 정보
                  </p>

                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">이메일</div>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-white border px-3 py-2">
                      <code className="text-sm font-mono text-gray-800 break-all">{result.student.email}</code>
                      <button
                        onClick={() => copyToClipboard(result.student.email, 'email')}
                        className="shrink-0 inline-flex items-center text-xs text-brand-600 hover:text-brand-800"
                      >
                        {copiedField === 'email' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
                        onClick={() => copyToClipboard(result.tempPassword, 'password')}
                        className="shrink-0 inline-flex items-center text-xs text-brand-600 hover:text-brand-800"
                      >
                        {copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 전체 메시지 복사 (카톡 전달용) */}
                <button
                  onClick={copyFullMessage}
                  className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white transition-all"
                  style={{ background: '#1A73E8', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
                >
                  {copiedField === 'all' ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Check className="h-4 w-4" /> 복사됨 — 학생에게 붙여넣어 주세요
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Copy className="h-4 w-4" /> 전체 메시지 복사하기 (카카오톡 전달용)
                    </span>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      setFullName('');
                      setEmail('');
                      setPhone('');
                      setServices([]);
                    }}
                    className="flex-1 rounded-[10px] border border-brand-200 bg-white py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
                  >
                    다른 학생 추가
                  </button>
                  <button
                    onClick={() => handleClose(false)}
                    className="flex-1 rounded-[10px] border py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
