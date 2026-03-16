'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FreeService = 'naesin' | 'voca';

const SERVICE_OPTIONS: { value: FreeService; label: string; desc: string; activeColor: string }[] = [
  { value: 'naesin', label: '올인내신', desc: '단어암기 + 교과서암기', activeColor: 'border-cyan-500 bg-cyan-50' },
  { value: 'voca', label: '올킬보카', desc: '1회독 단어 학습', activeColor: 'border-violet-500 bg-violet-50' },
];

interface AdminSignupFieldsProps {
  academyName: string;
  onAcademyNameChange: (v: string) => void;
  contactNumber: string;
  onContactNumberChange: (v: string) => void;
  freeService: FreeService;
  onFreeServiceChange: (v: FreeService) => void;
}

export function AdminSignupFields({
  academyName,
  onAcademyNameChange,
  contactNumber,
  onContactNumberChange,
  freeService,
  onFreeServiceChange,
}: AdminSignupFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="newAcademyName">학원명</Label>
        <Input
          id="newAcademyName"
          type="text"
          placeholder="학원 이름을 입력하세요"
          value={academyName}
          onChange={(e) => onAcademyNameChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contactNumber">연락처</Label>
        <Input
          id="contactNumber"
          type="tel"
          placeholder="010-0000-0000"
          value={contactNumber}
          onChange={(e) => onContactNumberChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>무료 체험 서비스 선택</Label>
        <div className="grid grid-cols-2 gap-3">
          {SERVICE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                freeService === opt.value ? opt.activeColor : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="freeService"
                value={opt.value}
                checked={freeService === opt.value}
                onChange={() => onFreeServiceChange(opt.value)}
                className="sr-only"
              />
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-xs text-muted-foreground text-center">{opt.desc}</span>
            </label>
          ))}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        5명까지 무료로 시작하세요. 유료 전환 시 모든 기능이 해제됩니다.
      </p>
    </>
  );
}
