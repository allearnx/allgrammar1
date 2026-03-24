import { vocabMiddlePublishers, vocabMockYears, vocabSatYears } from '../_data';

export default function VocabSection() {
  return (
    <section className="allkill-section" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', padding: '96px 60px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -150, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,217,192,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 700, padding: '8px 20px', borderRadius: 100, marginBottom: 16 }}>수록 단어</div>
        <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, color: 'white', lineHeight: 1.3, marginBottom: 14 }}>
          중학부터 수능까지,<br /><span style={{ color: '#4DD9C0' }}>필요한 단어는 다 있어요</span>
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 56 }}>교과서부터 모의고사, 수능 기출까지.<br />학년과 목표에 맞게 골라서 공부하세요.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* 중학 */}
          <div className="allkill-vocab-card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '36px 40px', backdropFilter: 'blur(8px)', wordBreak: 'keep-all' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 32 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div className="allkill-vocab-badge" style={{ background: '#A78BFA', color: 'white' }}>중학교</div>
                  <div className="allkill-vocab-card-heading">전학년 전교과서 단어</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {['중1 전교과서', '중2 전교과서', '중3 전교과서'].map((t) => (
                    <span key={t} className="allkill-vocab-chip" style={{ background: 'rgba(167,139,250,0.25)', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.4)' }}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="allkill-vocab-pub-grid">
                {vocabMiddlePublishers.map((pub) => (
                  <div key={pub.name} style={{ background: pub.bg, border: `1px solid ${pub.border}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 800, color: pub.color, textAlign: 'center', letterSpacing: '-0.2px' }}>
                    {pub.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 고등 모의고사 */}
          <div className="allkill-vocab-card" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '36px 40px', backdropFilter: 'blur(8px)', wordBreak: 'keep-all' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                  <div className="allkill-vocab-badge" style={{ background: '#4DD9C0', color: '#0F172A' }}>모의고사</div>
                  <div className="allkill-vocab-card-heading">최근 5개년 · 고1–3</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {['고1', '고2', '고3'].map((grade) => (
                    <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="allkill-vocab-grade" style={{ color: '#4DD9C0' }}>{grade}</span>
                      {['3월', '6월', '9월', '11월'].map((month) => (
                        <span key={month} className="allkill-vocab-chip" style={{ background: 'rgba(77,217,192,0.15)', color: '#4DD9C0', border: '1px solid rgba(77,217,192,0.35)' }}>{month}</span>
                      ))}
                      <span className="allkill-vocab-years">× 5개년</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="allkill-vocab-visual" style={{ alignItems: 'flex-end' }}>
                {vocabMockYears.map((item, i) => (
                  <div key={item.year} style={{ background: item.active ? '#4DD9C0' : `rgba(77,217,192,${0.06 + (4 - i) * 0.03})`, border: `1px solid rgba(77,217,192,${item.active ? 0.9 : 0.15 + (4 - i) * 0.05})`, borderRadius: 10, padding: '10px 28px', fontSize: 15, fontWeight: 900, color: item.active ? '#0F172A' : `rgba(255,255,255,${0.25 + (4 - i) * 0.12})`, textAlign: 'center', letterSpacing: '0.5px', width: 110 }}>
                    {item.year}년
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 수능 기출 + 교과서 */}
          <div className="allkill-vocab-bottom">
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '36px 40px', backdropFilter: 'blur(8px)', wordBreak: 'keep-all' }}>
              <div className="allkill-vocab-badge" style={{ background: '#FEF08A', color: '#713F12', display: 'inline-block', marginBottom: 20 }}>수능 기출</div>
              <div className="allkill-vocab-subtitle">수능 기출 단어</div>
              <div className="allkill-vocab-desc" style={{ marginBottom: 20 }}>실제 수능에 출제된 단어만 엄선했습니다.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {vocabSatYears.map((y, i) => (
                  <span key={y} style={{ background: i === 0 ? 'rgba(254,240,138,0.2)' : 'rgba(254,240,138,0.07)', border: `1px solid rgba(254,240,138,${i === 0 ? 0.5 : 0.2})`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: i === 0 ? '#FEF08A' : 'rgba(254,240,138,0.45)' }}>{y}</span>
                ))}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: '36px 40px', backdropFilter: 'blur(8px)', wordBreak: 'keep-all' }}>
              <div className="allkill-vocab-badge" style={{ background: '#C4B5FD', color: '#3B0764', display: 'inline-block', marginBottom: 20 }}>교과서</div>
              <div className="allkill-vocab-subtitle">고등 교과서 단어</div>
              <div className="allkill-vocab-desc" style={{ marginBottom: 20 }}>고등 영어 교과서 핵심 단어를 수록했습니다.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['천재교육', '비상교육', 'YBM', '동아출판'].map((name) => (
                  <span key={name} style={{ background: 'rgba(196,181,253,0.1)', border: '1px solid rgba(196,181,253,0.25)', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#C4B5FD' }}>{name}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
