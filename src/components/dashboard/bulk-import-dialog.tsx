'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface ParsedStudent {
  full_name: string;
  email: string;
  phone?: string;
}

export function BulkImportDialog() {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<ParsedStudent[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; failed: { email: string; reason: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: ParsedStudent[] = [];
        for (const row of results.data as Record<string, string>[]) {
          const full_name = row['이름'] || row['name'] || row['full_name'] || '';
          const email = row['이메일'] || row['email'] || '';
          const phone = row['전화번호'] || row['phone'] || '';
          if (full_name && email) {
            parsed.push({ full_name: full_name.trim(), email: email.trim(), phone: phone.trim() || undefined });
          }
        }
        if (parsed.length === 0) {
          toast.error('유효한 학생 데이터가 없습니다. CSV에 "이름"과 "이메일" 열이 필요합니다.');
          return;
        }
        if (parsed.length > 100) {
          toast.error('최대 100명까지 일괄 등록 가능합니다.');
          return;
        }
        setStudents(parsed);
        setResult(null);
      },
      error: () => {
        toast.error('CSV 파일을 읽는 중 오류가 발생했습니다.');
      },
    });
  }

  function toggleService(service: string) {
    setServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await fetch('/api/admin/students/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          students,
          services: services.length > 0 ? services : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '등록 실패');

      setResult(data);
      if (data.created > 0) {
        toast.success(`${data.created}명의 학생이 등록되었습니다`);
        router.refresh();
      }
      if (data.failed?.length > 0) {
        toast.warning(`${data.failed.length}명 등록 실패`);
      }
    } catch (err) {
      toast.error('등록 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setImporting(false);
    }
  }

  function handleClose(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      setStudents([]);
      setServices([]);
      setResult(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:shadow-sm hover:border-violet-300"
      >
        <Upload className="h-4 w-4 mr-1.5 text-gray-400" />
        CSV 일괄 등록
      </button>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto p-0">
        {/* 헤더 */}
        <div
          className="px-6 pt-5 pb-4"
          style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-violet-500" />
              학생 일괄 등록
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              CSV 파일로 학생을 한 번에 등록합니다
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* 파일 업로드 */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">CSV 파일</Label>
            <p className="text-xs text-gray-400">
              &quot;이름&quot;, &quot;이메일&quot; 열 필수. &quot;전화번호&quot; 열은 선택.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-gray-200 p-6 text-center transition-all hover:border-violet-300 hover:bg-violet-50/30"
            >
              <Upload className="h-8 w-8 mx-auto text-gray-300 mb-2" />
              <span className="text-sm text-gray-500">파일을 선택하세요</span>
              {students.length > 0 && (
                <span className="block mt-1 text-sm font-semibold" style={{ color: '#7C3AED' }}>
                  {students.length}명 감지됨
                </span>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* 미리보기 테이블 */}
          {students.length > 0 && !result && (
            <>
              <div className="rounded-xl border overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">이름</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">이메일</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">전화번호</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={i} className="border-t hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-1.5 font-medium">{s.full_name}</td>
                        <td className="px-3 py-1.5 text-gray-500">{s.email}</td>
                        <td className="px-3 py-1.5 text-gray-400">{s.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 서비스 배정 */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">서비스 자동 배정 (선택)</Label>
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

              <button
                onClick={handleImport}
                disabled={importing}
                className="w-full rounded-[10px] py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
              >
                {importing ? '등록 중...' : `${students.length}명 등록하기`}
              </button>
            </>
          )}

          {/* 결과 */}
          {result && (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 rounded-xl p-4"
                style={{ background: 'linear-gradient(120deg, #F0FDF4, #DCFCE7)' }}
              >
                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#22C55E' }} />
                <span className="text-sm font-semibold text-gray-700">{result.created}명 등록 완료</span>
              </div>
              {result.failed.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: '#F43F5E' }}>
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-semibold">{result.failed.length}명 등록 실패</span>
                  </div>
                  <div className="rounded-xl border overflow-hidden max-h-32 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-500">이메일</th>
                          <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-500">사유</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.failed.map((f, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-1.5">{f.email}</td>
                            <td className="px-3 py-1.5 text-gray-400">{f.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <button
                onClick={() => handleClose(false)}
                className="w-full rounded-[10px] border py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
