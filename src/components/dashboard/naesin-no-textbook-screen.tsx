import { BookMarked, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function NaesinNoTextbookScreen({ userName }: { userName: string }) {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div
        className="overflow-hidden rounded-2xl p-6 md:p-8 text-white"
        style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' }}
      >
        <h2 className="text-xl md:text-2xl font-bold">
          환영합니다, {userName}님!
        </h2>
        <p className="mt-1 text-white/80">올인내신이 배정되었어요</p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ background: 'linear-gradient(120deg, #ECFEFF, #CFFAFE)' }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-cyan-500" />
          <h3 className="text-lg font-bold">시작하기</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center bg-cyan-500 text-white rounded-full w-7 h-7 text-sm font-bold shrink-0">1</span>
            <BookMarked className="h-5 w-5 text-cyan-400 shrink-0" />
            <span className="text-sm text-gray-700">교과서를 선택하면 학습을 시작할 수 있어요</span>
            <Link href="/student/naesin" className="ml-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-4 py-1.5 text-xs font-medium shrink-0 transition-colors">교과서 선택</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
