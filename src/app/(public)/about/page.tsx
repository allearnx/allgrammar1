const features = [
  {
    title: '실시간 수업 + 녹화 영상 제공',
    description: '모든 수업은 실시간으로 진행되어 선생님과 직접 소통하며 배울 수 있습니다. 수업에 참여하지 못했거나 다시 복습하고 싶을 때는 녹화 영상을 언제든 다시 볼 수 있어, 학습의 연속성이 끊기지 않습니다.',
  },
  {
    title: '숙제·피드백·리뷰 테스트 연결',
    description: '수업이 끝나면 숙제가 자동으로 배정되고, 제출 후에는 선생님의 1:1 피드백이 제공됩니다. 이해가 부족한 부분은 리뷰 테스트로 다시 점검하여, 배운 내용이 흩어지지 않고 완전히 내 것이 됩니다.',
  },
  {
    title: '수업 브리핑 자동 안내',
    description: '수업이 끝나면 오늘 배운 핵심 내용, 숙제, 다음 수업 안내가 학부모님께 자동으로 전달됩니다. 아이에게 "오늘 뭐 배웠어?"라고 물어볼 필요 없이, 학습 상황을 바로 확인할 수 있습니다.',
  },
  {
    title: '출석·학습 결과 누적 관리',
    description: '출석 기록, 숙제 완료율, 테스트 점수 등 모든 학습 데이터가 자동으로 누적됩니다. 단순히 "열심히 했다"가 아니라, 구체적인 숫자로 성장 과정을 확인할 수 있습니다.',
  },
  {
    title: '월말 학습 리포트 자동 생성',
    description: '매월 말, 한 달간의 학습 현황이 리포트로 정리되어 제공됩니다. 출석률, 숙제 완료율, 성적 변화 추이를 한눈에 파악하고, 다음 달 학습 방향을 설정할 수 있습니다.',
  },
  {
    title: '정기 형성 평가 시행',
    description: '고등 내신 1등급, 수능 1등급을 기준으로 정기적인 형성 평가를 시행합니다. 현재 학생의 위치를 객관적으로 파악하고, 목표까지 남은 거리를 확인하여 학습 방향을 정밀하게 조정합니다.',
  },
];

const achievements = [
  { number: '98%', label: '재원생 지필 시험 90점 이상' },
  { number: '97%', label: '재원생 성적 향상' },
  { number: '100%', label: '수행평가 포함 영어 A 달성 사례 다수' },
];

export default function AboutPage() {
  return (
    <>
      {/* 히어로 섹션 */}
      <section className="pt-36 pb-20 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#1d1d1f] tracking-tight">
            결과로 증명해온 온라인 영어,
          </h1>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mt-6 md:mt-8 bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
            이제는 시스템으로 완성합니다.
          </h1>
        </div>
      </section>

      {/* 소개 섹션 */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-[#1d1d1f] leading-relaxed">
            올라영은 <strong className="text-violet-600">중학생부터 고등학생</strong>까지<br />
            국내 중등·내신·국제중·국제학교 영어를 대비하는<br />
            <strong className="text-violet-600">실시간 온라인 영어 클래스</strong>에서 출발했습니다.
          </p>
          <p className="text-lg md:text-xl text-[#86868b] leading-relaxed mt-8">
            단순히 수업만 잘하는 곳이 아니라,<br />
            <strong className="text-[#1d1d1f]">수업 이후까지 책임지는 시스템</strong>을 만들어왔습니다.
          </p>
        </div>
      </section>

      {/* 왜 올라영 수업은 결과로 남을까요? */}
      <section className="py-24 px-4 bg-[#f5f5f7]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-[#1d1d1f] text-center mb-6 tracking-tight">
            왜 올라영 수업은<br className="md:hidden" />
            <span className="bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text text-transparent"> 결과</span>로 남을까요?
          </h2>
          <p className="text-center text-xl md:text-2xl text-[#86868b] mb-16">
            <strong className="text-[#1d1d1f]">수업</strong> · <strong className="text-[#1d1d1f]">숙제</strong> · <strong className="text-[#1d1d1f]">피드백</strong> · <strong className="text-[#1d1d1f]">복습</strong> · <strong className="text-[#1d1d1f]">학습 기록</strong><br />
            <span className="text-lg">이 모든 과정이 하나의 시스템 안에서 연결됩니다.</span>
          </p>
          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm">
            <div className="text-lg md:text-xl text-[#1d1d1f] leading-relaxed text-center">
              <p>
                수업이 끝나면 오늘 배운 내용과 숙제가 <strong>자동으로 정리</strong>되고,<br />
                학생은 해야 할 일이 <strong>명확</strong>해지며,<br />
                학부모는 학습 과정을 <strong>한눈에 확인</strong>할 수 있습니다.
              </p>
            </div>
            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
              <p className="text-xl md:text-2xl text-[#86868b]">
                그래서 &quot;열심히 했다&quot;가 아니라
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mt-2">
                <span className="bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text text-transparent">&quot;우리 아이가 어디까지 왔는지&quot;</span>가 보입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 올라영 수업은 이렇게 다릅니다 */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-[#1d1d1f] text-center mb-16 tracking-tight">
            올라영 수업은<br className="md:hidden" />
            <span className="bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text text-transparent"> 이렇게</span> 다릅니다
          </h2>
          <div className="space-y-6 max-w-3xl mx-auto">
            {features.map((feature) => (
              <div key={feature.title} className="p-8 md:p-10 bg-[#f5f5f7] rounded-3xl">
                <h3 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-4">{feature.title}</h3>
                <p className="text-[#424245] text-lg leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 숫자로 증명된 결과 */}
      <section className="py-24 px-4 bg-[#1d1d1f]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-4 tracking-tight">
            숫자로 증명된<br className="md:hidden" />
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent"> 결과</span>
          </h2>
          <p className="text-center text-[#86868b] mb-16 text-lg">
            국제중·국제학교·해외 재학생까지 다양한 레벨에서 검증
          </p>
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {achievements.map((item) => (
              <div key={item.number} className="text-center">
                <div className="text-6xl md:text-8xl font-black bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                  {item.number}
                </div>
                <p className="text-gray-400 text-lg">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[#86868b] text-lg">
            대치·강남은 물론, <strong className="text-white">영재고·자사고·국제학교</strong> 학생들에게도<br />
            높은 만족도를 기록하고 있습니다.
          </p>
        </div>
      </section>

      {/* 올라영이 추구하는 한 가지 */}
      <section className="py-24 px-4 bg-[#f5f5f7]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black text-[#1d1d1f] mb-12 tracking-tight">
            올라영이 추구하는<br className="md:hidden" />
            <span className="bg-gradient-to-r from-violet-600 to-cyan-400 bg-clip-text text-transparent"> 한 가지</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#86868b] leading-relaxed mb-8">
            공부를 더 시키는 것보다<br />
            <strong className="text-[#1d1d1f]">공부를 제대로 하게 만드는 것</strong>
          </p>
          <p className="text-xl md:text-2xl text-[#86868b] leading-relaxed">
            선생님과 학생, 학부모 모두가<br />
            <strong className="text-violet-600">덜 힘들고, 더 명확하게</strong> 공부할 수 있는<br />
            시스템을 만듭니다.
          </p>
          <div className="mt-16 p-10 bg-white rounded-3xl shadow-sm">
            <p className="text-2xl md:text-3xl font-bold text-[#1d1d1f] leading-relaxed">
              그래서 올라영의 수업은<br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                끝나지 않고 다음 단계로 이어집니다.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] mb-6">
            지금 바로 시작하세요
          </h2>
          <p className="text-lg text-[#86868b] mb-8">
            무료 레벨테스트로 학생의 현재 수준을 확인해보세요.
          </p>
          <a
            href="/#consultation-form"
            className="inline-block px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 rounded-full transition-all shadow-lg shadow-violet-300/30"
          >
            무료 상담 신청하기
          </a>
        </div>
      </section>
    </>
  );
}
