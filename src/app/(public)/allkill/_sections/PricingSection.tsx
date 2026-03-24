import AllkillPayButton from '@/components/public/allkill-pay-button';
import { C, freePlanIncluded, freePlanSteps, freePlanLocked, proPlanFeatures, proRoundSteps, academyFeatures } from '../_data';

export default function PricingSection() {
  return (
    <section id="price" className="allkill-section" style={{ padding: '96px 60px', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: C.lavenderLight, color: C.lavenderDark, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100, marginBottom: 16 }}>가격 안내</div>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', fontWeight: 900, color: C.gray800, lineHeight: 1.3, marginBottom: 14 }}>
          부담 없이 <span style={{ color: C.lavenderDark }}>시작하세요.</span>
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', color: C.gray400, lineHeight: 1.8, marginBottom: 56 }}>지금 바로 시작하세요.</p>

        <div className="allkill-price-grid">

          {/* 무료 플랜 */}
          <div className="allkill-price-card" style={{ borderRadius: 20, padding: '40px 36px', border: '1.5px solid #E5E7EB', background: 'white', transition: 'transform 0.2s', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'inline-block', background: '#F0FDF4', border: '1px solid #86EFAC', color: '#16A34A', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 100, marginBottom: 16, letterSpacing: '0.3px' }}>🎁 무료</div>
            <div className="allkill-price-plan-label" style={{ color: C.gray800, fontWeight: 900 }}>무료 플랜</div>
            <div className="allkill-montserrat allkill-price-amount" style={{ color: C.gray800 }}>₩0<span className="allkill-price-amount-unit" style={{ color: C.gray400 }}> / 월</span></div>
            <div className="allkill-price-subtitle" style={{ color: C.gray400 }}>회원가입 후 바로 이용 가능</div>
            <div style={{ height: 1, background: '#F3F4F6', marginBottom: 24 }} />

            <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', letterSpacing: '0.8px', marginBottom: 10 }}>포함</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {freePlanIncluded.map((f) => (
                <div key={f} className="allkill-price-feature" style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.gray600 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', fontSize: 11, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
                  {f}
                </div>
              ))}
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginBottom: 8, letterSpacing: '0.5px' }}>1회독 학습 단계</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {freePlanSteps.map((s) => (
                    <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 900, color: 'white', background: '#22C55E', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>{s.step}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 'auto' }}>{s.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.8px', marginBottom: 10 }}>구독 전용</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32, background: '#F9FAFB', borderRadius: 10, padding: '14px 16px', border: '1px solid #F3F4F6', flex: 1 }}>
              {freePlanLocked.map((f) => (
                <div key={f.text} className="allkill-price-feature" style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#C4C9D1' }}>
                  <span style={{ fontSize: 13, flexShrink: 0 }}>{f.icon}</span>
                  <span style={{ textDecoration: 'line-through', textDecorationColor: '#D1D5DB' }}>{f.text}</span>
                </div>
              ))}
            </div>

            <a href="https://voca.allrounderenglish.co.kr/login" target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
              <button className="allkill-price-btn" style={{ border: '1.5px solid #22C55E', background: 'transparent', color: '#16A34A', fontWeight: 700 }}>
                무료로 시작하기 →
              </button>
            </a>
          </div>

          {/* 개인 구독 */}
          <div className="allkill-price-card" style={{ borderRadius: 20, padding: '40px 36px', border: `2px solid ${C.lavender}`, boxShadow: '0 16px 48px rgba(167,139,250,0.18)', position: 'relative', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', background: C.lavender, color: 'white', fontSize: 13, fontWeight: 700, padding: '5px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}>🐣 얼리버드 특가</div>
            <div className="allkill-price-plan-label" style={{ color: C.gray400 }}>개인 구독</div>
            <div className="allkill-montserrat allkill-price-amount" style={{ color: C.gray800 }}>월 9,900<span className="allkill-price-amount-unit" style={{ color: C.gray400 }}>원</span></div>
            <div className="allkill-price-discount" style={{ color: C.gray400 }}>
              <s style={{ color: 'rgba(0,0,0,0.3)' }}>정가 17,000원</s> → <b style={{ color: C.lavenderDark }}>얼리버드 특가</b>
            </div>
            <div className="allkill-price-notice" style={{ background: '#FEF9C3', border: '1px solid #FDE047', color: '#713F12' }}>
              📚 현재 수록 단어: 고1·2·3 3월 모의고사<br />각 학년 1–2과 단어 제공 중 (업데이트 예정)
            </div>
            <div style={{ height: 1, background: '#F2F0FF', marginBottom: 28 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36, flex: 1 }}>
              {proPlanFeatures.map((f) => (
                <div key={f} className="allkill-price-feature" style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.gray600 }}>
                  <span style={{ color: '#4DD9C0', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
              <div style={{ background: '#F5F3FF', borderRadius: 10, padding: '12px 16px', marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.lavenderDark, marginBottom: 8, letterSpacing: '0.5px' }}>1회독 + 2회독 전체 포함</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {proRoundSteps.map((s) => (
                    <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 900, color: 'white', background: s.round === 2 ? C.lavenderDark : '#0891B2', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>{s.step}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.gray600 }}>{s.name}</span>
                      <span style={{ fontSize: 11, color: C.gray400, marginLeft: 'auto' }}>{s.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <AllkillPayButton />
          </div>

          {/* 학원 단체 */}
          <div className="allkill-price-card" style={{ borderRadius: 20, padding: '40px 36px', border: '2px solid #F2F0FF', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
            <div className="allkill-price-plan-label" style={{ color: C.gray400 }}>학원 단체</div>
            <div className="allkill-montserrat allkill-price-amount" style={{ color: C.gray800 }}>문의<span className="allkill-price-amount-unit" style={{ color: C.gray400 }}>하기</span></div>
            <div className="allkill-price-subtitle" style={{ color: C.gray400 }}>학원/그룹 맞춤 견적</div>
            <div style={{ height: 1, background: '#F2F0FF', marginBottom: 28 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36, flex: 1 }}>
              {academyFeatures.map((f) => (
                <div key={f} className="allkill-price-feature" style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.gray600 }}>
                  <span style={{ color: '#4DD9C0', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button className="allkill-price-btn" style={{ border: `1.5px solid ${C.lavender}`, background: 'transparent', color: C.lavenderDark }}>
              학원 문의하기
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
