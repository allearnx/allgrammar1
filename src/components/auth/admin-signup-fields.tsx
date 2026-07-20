'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminSignupFieldsProps {
  academyName: string;
  onAcademyNameChange: (v: string) => void;
}

// 무료 체험 서비스 택1 UI는 제거 (2026-07-20) — 무료는 둘 다 체험 정책(택1 폐지)이라
// 선택이 무의미했고, 기본값(올인내신)이 보카 퍼널 첫인상과 어긋났음.
// free_service 메타데이터를 안 보내면 학원 트리거가 NULL로 생성 = 제한 없음(정책 그대로).
export function AdminSignupFields({ academyName, onAcademyNameChange }: AdminSignupFieldsProps) {
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
      <p className="text-sm text-muted-foreground">
        학생 5명, Day 3개까지 무료로 시작하세요. 유료 전환 시 모든 기능이 해제됩니다.
      </p>
    </>
  );
}
