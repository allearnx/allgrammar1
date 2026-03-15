'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Users, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { Academy } from '@/types/user';

interface Props {
  academy: Academy;
  currentStudents: number;
}

export function AcademySettingsClient({ academy, currentStudents }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: academy.name || '',
    contact_phone: academy.contact_phone || '',
    contact_email: academy.contact_email || '',
    address: academy.address || '',
  });

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
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || null,
          contact_phone: form.contact_phone || null,
          contact_email: form.contact_email || null,
          address: form.address || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '저장 실패');
      }

      toast.success('설정이 저장되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('저장 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
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

      {/* 초대 코드 */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
      >
        <div
          className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        />
        <div className="relative">
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

      {/* 학원 정보 */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="inline-flex rounded-lg bg-indigo-50 p-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold">학원 정보</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
            style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
          >
            {saving ? '저장 중...' : '설정 저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
