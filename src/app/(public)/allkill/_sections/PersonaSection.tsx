import { C, personaCards } from '../_data';

export default function PersonaSection() {
  return (
    <section className="allkill-section" style={{ padding: '96px 60px', background: C.gray50 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: C.lavenderLight, color: C.lavenderDark, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100, marginBottom: 16 }}>학부모 & 학생</div>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', fontWeight: 900, color: C.gray800, lineHeight: 1.3, marginBottom: 14 }}>
          학부모도, 학생도<br /><span style={{ color: C.lavenderDark }}>모두 만족하는 이유</span>
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', color: C.gray400, lineHeight: 1.8, marginBottom: 56 }}>
          올킬보카는 학생의 자기주도 학습을 돕고,<br />학부모의 불안을 해소합니다.
        </p>

        <div className="allkill-parent-grid">
          {personaCards.map((card) => (
            <div key={card.tag} className="allkill-persona-card" style={{ background: 'white', borderRadius: 24, padding: '44px 40px', border: '1px solid rgba(167,139,250,0.12)' }}>
              <span className="allkill-persona-tag" style={{ background: card.tagBg, color: card.tagColor }}>{card.tag}</span>
              <h3 className="allkill-persona-title" style={{ color: C.gray800 }}>{card.title}</h3>
              <p className="allkill-persona-desc" style={{ color: C.gray400 }}>{card.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {card.points.map((point) => (
                  <div key={point} className="allkill-persona-point" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, color: C.gray600 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4DD9C0', color: 'white', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>✓</span>
                    {point}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
