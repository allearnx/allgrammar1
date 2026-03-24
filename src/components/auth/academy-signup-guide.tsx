export function AcademySignupGuide() {
  const steps = [
    { num: '01', title: '학원 정보 입력', desc: '학원명과 연락처를 입력하세요.' },
    { num: '02', title: '무료 서비스 선택', desc: '올인내신 또는 올킬보카 중 하나를 선택합니다.' },
    { num: '03', title: '초대코드 자동 발급', desc: '가입 즉시 6자리 초대코드가 생성됩니다.' },
    { num: '04', title: '학생·선생님 초대', desc: '코드를 공유하면 바로 학습을 시작할 수 있습니다.' },
  ];

  return (
    <div className="rounded-2xl overflow-hidden border border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-white text-center">
      <div className="h-1 bg-gradient-to-r from-indigo-400 via-amber-400 to-indigo-400" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <p className="text-base font-semibold tracking-wide text-indigo-900">
          <span className="text-amber-500">✦</span>{' '}학원 가입 안내
        </p>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((s) => (
            <div key={s.num} className="flex flex-col items-center gap-1">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                {s.num}
              </span>
              <p className="text-sm font-medium text-indigo-900">{s.title}</p>
              <p className="text-xs text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-auto h-px w-16 bg-indigo-200" />

        {/* Free trial card */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-700">
            <span>✦</span> 무료 체험
          </p>
          <ul className="space-y-0.5 text-xs text-slate-600">
            <li>학생 5명까지 무료</li>
            <li>서비스 1개 (내신 or 보카)</li>
            <li>유료 전환 시 전체 해금</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
