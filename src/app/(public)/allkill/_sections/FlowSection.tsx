import { C, flowSteps1, flowSteps2 } from '../_data';

export default function FlowSection() {
  return (
    <section className="allkill-section" style={{ padding: '96px 60px', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: C.lavenderLight, color: C.lavenderDark, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100, marginBottom: 16 }}>학습 시스템</div>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', fontWeight: 900, color: C.gray800, lineHeight: 1.3, marginBottom: 14 }}>
          1회독 + 2회독, <span style={{ color: C.lavenderDark }}>총 7단계</span><br />
          외우고, 이해하고,<br />완전히 내 것으로.
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', color: C.gray400, lineHeight: 1.8, marginBottom: 56 }}>
          각 단계마다 통과 기준이 있습니다.<br />
          2회 연속 실패하면 오답만 모아서 다시 테스트합니다.<br />
          모르는 단어는 끝까지 잡아드려요.
        </p>

        {/* 1회독 */}
        <div style={{ background: 'linear-gradient(135deg, rgba(209,250,250,0.6), rgba(207,250,254,0.4))', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 28, padding: '40px 32px', marginBottom: 32, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(6,182,212,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span className="allkill-flow-round-badge" style={{ background: 'rgba(6,182,212,0.15)', color: '#0891B2', border: '1px solid rgba(6,182,212,0.25)' }}>1회독</span>
            <span className="allkill-flow-label-title" style={{ color: C.gray800 }}>단어 암기</span>
            <span className="allkill-round-label-desc" style={{ marginLeft: 'auto', fontSize: 13, color: C.gray400, fontWeight: 500 }}>4단계 통과 시스템</span>
          </div>
          <div className="allkill-flow-1">
            {flowSteps1.map((step) => (
              <div key={step.n} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="allkill-flow-num" style={{ borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: C.gray800 }}>{step.n}</div>
                <div className="allkill-flow-card" style={{ background: step.bg, borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, transition: 'border-color 0.2s, transform 0.2s', border: '2px solid transparent', borderTopWidth: 4, borderTopColor: step.borderColor, borderTopStyle: 'solid' }}>
                  <div className="allkill-flow-step-name" style={{ color: step.dark ? 'white' : C.gray800 }}>{step.name}</div>
                  <span className="allkill-flow-pass" style={{ background: 'white', color: step.passColor, border: `1.5px solid ${step.passColor}` }}>{step.pass}</span>
                  <div className="allkill-flow-desc" style={{ color: step.dark ? 'rgba(255,255,255,0.85)' : C.gray600, borderTop: step.dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.06)' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2회독 */}
        <div style={{ background: 'linear-gradient(135deg, rgba(237,233,254,0.6), rgba(221,214,254,0.4))', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 28, padding: '40px 32px', backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(124,58,237,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span className="allkill-flow-round-badge" style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED', border: '1px solid rgba(124,58,237,0.2)' }}>2회독</span>
            <span className="allkill-flow-label-title" style={{ color: C.gray800 }}>완전 정복</span>
            <span className="allkill-round-label-desc" style={{ marginLeft: 'auto', fontSize: 13, color: C.gray400, fontWeight: 500 }}>심화 학습 · AI 채점</span>
          </div>
          <div className="allkill-flow-2">
            {flowSteps2.map((step) => (
              <div key={step.n} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="allkill-flow-num" style={{ borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', color: C.gray800 }}>{step.n}</div>
                <div className="allkill-flow-card" style={{ background: step.bg, borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1, transition: 'border-color 0.2s, transform 0.2s', border: '2px solid transparent', borderTopWidth: 4, borderTopColor: step.borderColor, borderTopStyle: 'solid' }}>
                  <div className="allkill-flow-step-name" style={{ color: step.dark ? 'white' : C.gray800 }}>{step.name}</div>
                  <span className="allkill-flow-pass" style={{ background: 'white', color: step.passColor, border: `1.5px solid ${step.passColor}` }}>{step.pass}</span>
                  <div className="allkill-flow-desc" style={{ color: step.dark ? 'rgba(255,255,255,0.85)' : C.gray600, borderTop: step.dark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.06)' }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
