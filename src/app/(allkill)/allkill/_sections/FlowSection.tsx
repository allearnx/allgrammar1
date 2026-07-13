import { C, flowSteps1, flowSteps2 } from '../_data';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '52px 0 16px' }}>
          <span style={{ background: C.blueLight, color: C.blueDark, fontSize: 14, fontWeight: 800, padding: '6px 16px', borderRadius: 100 }}>1회독</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>단어 암기</span>
        </div>
        <div className="ak-flow-grid-4">
          {flowSteps1.map((step) => (
            <div key={step.n} className="ak-flow-card">
              <div className="ak-flow-num" style={{ background: C.blueLight, color: C.blueDark }}>{step.n}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 8 }}>{step.name}</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.blue, background: 'white', border: `1.5px solid ${C.blueLight}`, padding: '3px 12px', borderRadius: 100 }}>{step.pass}</span>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.65, marginTop: 12, wordBreak: 'keep-all' }}>{step.desc}</p>
            </div>
          ))}
        </div>

        {/* 2회독 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '36px 0 16px' }}>
          <span style={{ background: C.ink, color: 'white', fontSize: 14, fontWeight: 800, padding: '6px 16px', borderRadius: 100 }}>2회독</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>완전 정복</span>
        </div>
        <div className="ak-flow-grid-3">
          {flowSteps2.map((step) => (
            <div key={step.n} className="ak-flow-card">
              <div className="ak-flow-num" style={{ background: C.ink, color: 'white' }}>{step.n}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, marginBottom: 8 }}>{step.name}</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.gray, background: 'white', border: `1.5px solid ${C.line}`, padding: '3px 12px', borderRadius: 100 }}>{step.pass}</span>
              <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.65, marginTop: 12, wordBreak: 'keep-all' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
