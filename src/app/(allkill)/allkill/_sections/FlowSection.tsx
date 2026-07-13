import { C, flowSteps1, flowSteps2, stepThemes } from '../_data';

interface FlowStep {
  n: number;
  name: string;
  pass: string;
  desc: string;
}

/** 스텝 카드 — 구글 4색 순환 테마 (숫자 원 채움 + 통과 뱃지 틴트) */
function StepCard({ step }: { step: FlowStep }) {
  const theme = stepThemes[(step.n - 1) % stepThemes.length];
  return (
    <div className="ak-flow-card">
      <div className="ak-flow-num ak-display" style={{ background: theme.solid, color: 'white' }}>{step.n}</div>
      <div className="ak-display" style={{ fontSize: 20, color: C.ink, marginBottom: 10 }}>{step.name}</div>
      <span style={{ fontSize: 14, fontWeight: 700, color: theme.text, background: theme.bg, padding: '5px 14px', borderRadius: 100 }}>{step.pass}</span>
      <p style={{ fontSize: 16, color: C.gray, lineHeight: 1.7, marginTop: 14, wordBreak: 'keep-all' }}>{step.desc}</p>
    </div>
  );
}

/** 7단계 — 랜딩 전체에서 이 섹션 딱 한 번만 보여준다 */
export default function FlowSection() {
  return (
    <section className="ak-section" style={{ padding: '96px 24px', background: 'white' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <span className="ak-badge">7단계 통과 시스템</span>
        <h2 className="ak-h2" style={{ color: C.ink }}>
          한 번 보고 끝이 아니라,<br />
          <span style={{ color: C.blue }}>통과할 때까지.</span>
        </h2>
        <p className="ak-sub" style={{ color: C.gray }}>
          단계마다 통과 점수가 있어요. 두 번 연속 못 넘으면<br />
          틀린 단어만 모아 다시 시험 — 모르는 단어는 끝까지 잡아요.
        </p>

        {/* 1회독 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '56px 0 18px' }}>
          <span className="ak-display" style={{ background: C.blue, color: 'white', fontSize: 15, padding: '8px 18px', borderRadius: 100 }}>1회독</span>
          <span className="ak-display" style={{ fontSize: 19, color: C.ink }}>단어 암기</span>
        </div>
        <div className="ak-flow-grid-4">
          {flowSteps1.map((step) => <StepCard key={step.n} step={step} />)}
        </div>

        {/* 2회독 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '40px 0 18px' }}>
          <span className="ak-display" style={{ background: C.ink, color: 'white', fontSize: 15, padding: '8px 18px', borderRadius: 100 }}>2회독</span>
          <span className="ak-display" style={{ fontSize: 19, color: C.ink }}>완전 정복</span>
        </div>
        <div className="ak-flow-grid-3">
          {flowSteps2.map((step) => <StepCard key={step.n} step={step} />)}
        </div>
      </div>
    </section>
  );
}
