'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface InviteCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  academyName: string | null;
  onAcademyNameChange: (name: string | null) => void;
}

export function InviteCodeField({ value, onChange, academyName, onAcademyNameChange }: InviteCodeFieldProps) {
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = value.trim().toUpperCase();
    onAcademyNameChange(null);
    setError(null);

    if (code.length !== 6) return;

    const controller = new AbortController();
    setValidating(true);

    fetchWithToast<{ academyName: string }>(`/api/auth/validate-invite-code?code=${code}`, {
      method: 'GET',
      silent: true,
      logContext: 'auth.validate_invite_code',
      fetchOptions: { signal: controller.signal },
    })
      .then((data) => {
        onAcademyNameChange(data.academyName);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError('유효하지 않은 초대 코드입니다');
      })
      .finally(() => setValidating(false));

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor="inviteCode">초대 코드 (선택)</Label>
      <Input
        id="inviteCode"
        type="text"
        placeholder="6자리 코드 입력"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase().slice(0, 6))}
        maxLength={6}
        className="font-mono tracking-widest uppercase"
        autoComplete="off"
      />
      {validating && (
        <p className="text-sm text-muted-foreground">확인 중...</p>
      )}
      {academyName && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" />
          {academyName}
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <XCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
}
