import { bentoCard1Steps, bentoReportRows } from '../_data';

export default function WhyBentoSection() {
  return (
    <section id="why" className="allkill-section" style={{ padding: '96px 60px', background: '#0D1117', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -200, left: -150, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,217,192,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'inline-block', background: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100, marginBottom: 20, letterSpacing: '1px' }}>WHY 올킬보카</div>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', fontWeight: 900, color: 'white', lineHeight: 1.3, marginBottom: 12 }}>
          단어 공부,{' '}
          <span style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #4DD9C0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>이렇게 달라요</span>
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', color: 'rgba(255,255,255,0.4)', lineHeight: 1.8, marginBottom: 48 }}>기존 단어장과는 다릅니다. 단계별 학습으로 진짜 내 단어를 만들어 드려요.</p>

        <div className="allkill-bento">
          {/* Card 01 — 7단계 통과 시스템 (span 2) */}
          <div className="allkill-bento-card allkill-bento-span2" style={{ background: 'linear-gradient(135deg, rgba(77,217,192,0.07) 0%, rgba(77,217,192,0.02) 100%)', border: '1px solid rgba(77,217,192,0.18)', borderRadius: 24, padding: '40px 44px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,217,192,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'inline-block', background: 'rgba(77,217,192,0.12)', color: '#4DD9C0', border: '1px solid rgba(77,217,192,0.25)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, marginBottom: 24, letterSpacing: '0.8px' }}>PASS / FAIL 시스템</div>
            <div className="allkill-montserrat" style={{ fontSize: 88, fontWeight: 900, color: '#4DD9C0', lineHeight: 1, marginBottom: 6, textShadow: '0 0 48px rgba(77,217,192,0.35)' }}>7단계</div>
            <h3 className="allkill-bento-h3-lg">통과 시스템</h3>
            <p className="allkill-bento-body" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32, maxWidth: 380 }}>플래시카드 → 퀴즈 → 스펠링 → 매칭.<br />7단계를 모두 통과해야 진짜 내 단어가 됩니다.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {bentoCard1Steps.map((step, i) => (
                <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ background: step.active ? '#4DD9C0' : 'rgba(77,217,192,0.1)', border: '1px solid rgba(77,217,192,0.35)', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: step.active ? '#0D1117' : '#4DD9C0', whiteSpace: 'nowrap' as const }}>{step.label}</div>
                  {i < 3 && <span style={{ color: 'rgba(77,217,192,0.35)', fontSize: 16, fontWeight: 300 }}>→</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Card 02 — 2회독 */}
          <div className="allkill-bento-card" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.07) 0%, rgba(167,139,250,0.02) 100%)', border: '1px solid rgba(167,139,250,0.18)', borderRadius: 24, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'inline-block', background: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, marginBottom: 24, letterSpacing: '0.8px' }}>심화 학습 시스템</div>
            <div className="allkill-montserrat" style={{ fontSize: 72, fontWeight: 900, color: '#A78BFA', lineHeight: 1, marginBottom: 6, textShadow: '0 0 40px rgba(167,139,250,0.35)' }}>2회독</div>
            <h3 className="allkill-bento-h3-md">완전 정복</h3>
            <p className="allkill-bento-body" style={{ color: 'rgba(255,255,255,0.45)' }}>1회독으로 외우고, 2회독에서 유의어·반의어·숙어까지. 9가지 유형으로 완전히 내 것으로.</p>
          </div>

          {/* Card 03 — AI 채점 */}
          <div className="allkill-bento-card" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(251,191,36,0.02) 100%)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 24, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'inline-block', background: 'rgba(251,191,36,0.12)', color: '#FCD34D', border: '1px solid rgba(251,191,36,0.25)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, marginBottom: 24, letterSpacing: '0.8px' }}>AI 채점 시스템</div>
            <div className="allkill-montserrat" style={{ fontSize: 72, fontWeight: 900, color: '#FCD34D', lineHeight: 1, marginBottom: 6, textShadow: '0 0 40px rgba(251,191,36,0.35)' }}>AI</div>
            <h3 className="allkill-bento-h3-md">영작 채점</h3>
            <p className="allkill-bento-body" style={{ color: 'rgba(255,255,255,0.45)' }}>2회독에서는 뜻을 직접 영작합니다. AI가 의미 이해 기반으로 채점해 진짜 이해를 확인합니다.</p>
          </div>

          {/* Card 04 — 틀린 단어 재시험 */}
          <div className="allkill-bento-card" style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.07) 0%, rgba(244,63,94,0.02) 100%)', border: '1px solid rgba(244,63,94,0.18)', borderRadius: 24, padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'inline-block', background: 'rgba(244,63,94,0.12)', color: '#F87171', border: '1px solid rgba(244,63,94,0.25)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, marginBottom: 24, letterSpacing: '0.8px' }}>오답 집중 복습</div>
            <div className="allkill-montserrat" style={{ fontSize: 60, fontWeight: 900, color: '#F87171', lineHeight: 1, marginBottom: 6, textShadow: '0 0 40px rgba(244,63,94,0.35)' }}>오답만</div>
            <h3 className="allkill-bento-h3-md">재시험</h3>
            <p className="allkill-bento-body" style={{ color: 'rgba(255,255,255,0.45)' }}>틀린 단어만 자동으로 모아서 다시 시험볼 수 있습니다. 약한 단어를 집중 공략하세요.</p>
          </div>

          {/* Card 05 — 학부모 리포트 (span 3) */}
          <div className="allkill-bento-card allkill-bento-span3" style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.07) 0%, rgba(56,189,248,0.02) 100%)', border: '1px solid rgba(56,189,248,0.18)', borderRadius: 24, padding: '40px 44px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-block', background: 'rgba(56,189,248,0.12)', color: '#38BDF8', border: '1px solid rgba(56,189,248,0.25)', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 100, marginBottom: 24, letterSpacing: '0.8px' }}>실시간 리포트</div>
                <div className="allkill-montserrat" style={{ fontSize: 80, fontWeight: 900, color: '#38BDF8', lineHeight: 1, marginBottom: 6, textShadow: '0 0 48px rgba(56,189,248,0.35)' }}>리포트</div>
                <h3 className="allkill-bento-h3-lg">학부모 공유</h3>
                <p className="allkill-bento-body" style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 360 }}>학습 완료 후 리포트 링크를 학부모에게 바로 공유. 어떤 단어를 틀렸는지, 몇 단계까지 완료했는지 한눈에 확인하세요.</p>
              </div>
              <div className="allkill-bento-report" style={{ flexShrink: 0, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 16, padding: '24px 28px', minWidth: 220 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 16, letterSpacing: '0.5px' }}>학습 리포트</div>
                {bentoReportRows.map((row) => (
                  <div key={row.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: row.done ? '#4DD9C0' : '#38BDF8', fontWeight: 700 }}>{row.pct}</span>
                    </div>
                    <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 100 }}>
                      <div style={{ height: '100%', width: row.pct, background: row.done ? 'linear-gradient(90deg, #4DD9C0, #38BDF8)' : '#38BDF8', borderRadius: 100, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>링크 하나로 바로 공유</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
