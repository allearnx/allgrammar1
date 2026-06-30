import { requireUser } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { UPDATES, TAG_LABEL } from '@/lib/updates';
import { Sparkles } from 'lucide-react';

const TAG_STYLE: Record<string, string> = {
  new: 'bg-indigo-600 text-white',
  improve: 'bg-emerald-100 text-emerald-700',
  guide: 'bg-amber-100 text-amber-700',
};

export default async function UpdatesPage() {
  const user = await requireUser();

  return (
    <>
      <Topbar user={user} title="업데이트·사용법" />
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <div className="mb-5 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h1 className="text-lg font-bold text-gray-800">새로운 기능과 사용법</h1>
        </div>

        {UPDATES.length === 0 ? (
          <p className="py-12 text-center text-gray-400">아직 업데이트가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {UPDATES.map((u) => (
              <div key={u.id} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TAG_STYLE[u.tag] ?? 'bg-gray-100 text-gray-600'}`}>
                    {TAG_LABEL[u.tag]}
                  </span>
                  <span className="text-xs text-gray-400">{u.date}</span>
                </div>
                <h2 className="font-bold text-gray-900">{u.title}</h2>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-gray-600">{u.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
