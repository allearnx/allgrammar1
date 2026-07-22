'use client';

// 임시 진단 페이지: 중3 교과서 단어 음원 재생 문제 기기별 확인용 — 원인 확인 후 삭제
import { useState } from 'react';

const FILES: { book: string; word: string; url: string }[] = [
  { book: '워드마스터(정상 기준)', word: 'advise', url: 'https://lrzomudeakboasawnvjl.supabase.co/storage/v1/object/public/public-audio/voca/b84e5f9c-821d-41be-9d57-141ef413530d.mp3' },
  { book: '워드마스터(정상 기준)', word: 'obstacle', url: 'https://lrzomudeakboasawnvjl.supabase.co/storage/v1/object/public/public-audio/voca/ad7b5b23-0089-4efd-8b51-48d351ec2397.mp3' },
  { book: '중3 교과서 단어', word: 'ability', url: 'https://lrzomudeakboasawnvjl.supabase.co/storage/v1/object/public/public-audio/voca/58e8d42c-efd9-40a5-b620-3069a3e76353.mp3' },
  { book: '중3 교과서 단어', word: 'recipe', url: 'https://lrzomudeakboasawnvjl.supabase.co/storage/v1/object/public/public-audio/voca/0b6aa76f-05d1-485e-9cdb-d7c420f986ed.mp3' },
  { book: '중3 교과서 단어', word: 'harmful', url: 'https://lrzomudeakboasawnvjl.supabase.co/storage/v1/object/public/public-audio/voca/17198c44-1cf2-4fa1-942a-2ad06a9fba1a.mp3' },
];

export default function TrialAudioPage() {
  const [results, setResults] = useState<Record<string, string>>({});

  async function tryPlay(key: string, url: string) {
    setResults((r) => ({ ...r, [key]: '재생 중…' }));
    const a = new Audio(url);
    try {
      await a.play();
      setResults((r) => ({ ...r, [key]: '✅ 재생 성공 (소리 들리는지 확인)' }));
    } catch (e) {
      const err = e as Error;
      setResults((r) => ({ ...r, [key]: `❌ 실패: ${err.name} — ${err.message}` }));
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6 space-y-4">
      <h1 className="text-lg font-bold">🔊 음원 재생 진단 (임시 페이지)</h1>
      <p className="text-sm text-gray-500">
        문제가 있는 그 브라우저에서 각 버튼을 눌러보세요. 결과가 아래에 표시됩니다.
        아래 회색 플레이어(▶)도 눌러서 비교해 주세요.
      </p>
      {FILES.map((f, i) => {
        const key = `${i}`;
        return (
          <div key={key} className="rounded-xl border p-4 space-y-2">
            <p className="text-sm font-bold">{f.book} · {f.word}</p>
            <button
              type="button"
              onClick={() => tryPlay(key, f.url)}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white"
            >
              ▶ JS로 재생 (앱과 같은 방식)
            </button>
            {results[key] && <p className="text-sm">{results[key]}</p>}
            <audio controls preload="none" src={f.url} className="w-full" />
          </div>
        );
      })}
    </div>
  );
}
