import Link from 'next/link';
import AllkillPayButton from '@/components/public/allkill-pay-button';
import { C, freePlanFeatures, selfStudyPlanFeatures, selfStudyExclusions, proPlanFeatures, proRoundSteps, academyFeatures } from '../_data';

const KAKAO_URL = 'http://pf.kakao.com/_iLxcLG/chat';

interface PricingSectionProps {
  vocaCourseId?: string;
  vocaCoursePrice?: number;
  selfStudyCourseId?: string;
  selfStudyCoursePrice?: number;
}

export default function PricingSection({ vocaCourseId, vocaCoursePrice, selfStudyCourseId, selfStudyCoursePrice }: PricingSectionProps) {
  return (
    <section id="price" className="allkill-section" style={{ padding: '96px 60px', background: 'white' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'inline-block', background: C.lavenderLight, color: C.lavenderDark, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100, marginBottom: 16 }}>가격 안내</div>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 48px)', fontWeight: 900, color: C.gray800, lineHeight: 1.3, marginBottom: 14 }}>
          부담 없이 <span style={{ color: C.lavenderDark }}>시작하세요.</span>
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', color: C.gray400, lineHeight: 1.8, marginBottom: 56 }}>Day 3개 무료 체험! 지금 바로 시작하세요.</p>

        <div className="allkill-price-grid">

          {/* 무료 체험 */}
          <div className="allkill-price-card" style={{ borderRadius: 20, padding: '40px 36px', border: '2px solid #E5E7EB', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
            <div className="allkill-price-plan-label" style={{ color: C.gray400 }}>무료 체험</div>
            <div className="allkill-montserrat allkill-price-amount" style={{ color: C.gray800 }}>월 0<span className="allkill-price-amount-unit" style={{ color: C.gray400 }}>원</span></div>
            <div className="allkill-price-subtitle" style={{ color: C.gray400 }}>가입만 하면 바로 시작</div>
            <div style={{ height: 1, background: '#F2F0FF', marginBottom: 28 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36, flex: 1 }}>
              {freePlanFeatures.map((f) => (
                <div key={f} className="allkill-price-feature" style={{ display: 'flex', alignItems: 'center', gap: 12, color: C.gray600 }}>
                  <span style={{ color: '#4DD9C0', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="inline-block w-full text-center px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
              style={{ border: `1.5px solid ${C.lavender}`, background: 'transparent', color: C.lavenderDark }}
            >
              무료로 시작하기
            </Link>
          </div>

          {/* 셀프 스터디 */}
          <div className="allkill-price-card" style={{ borderRadius: 20, padding: '40px 36px', border: '2px solid #0891B2', background: 'linear-gradient(180deg, #F0FDFA 0%, #FFFFFF 40%)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
              </div>
              <div className="allkill-price-plan-label" style={{ color: '#0891B2', fontWeight: 700, marginBottom: 0 }}>셀프 스터디</div>
            </div>
            <div className="allkill-montserrat allkill-price-amount" style={{ color: C.gray800 }}>월 24,000<span className="allkill-price-amount-unit" style={{ color: C.gray400 }}>원</span></div>
            <div className="allkill-price-subtitle" style={{ color: C.gray400 }}>선생님 없이 · 혼자서 완벽하게</div>

            {/* 학습 콘텐츠 카드 */}
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E0F2FE', marginBottom: 16, boxShadow: '0 2px 8px rgba(8,145,178,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0891B2', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 10 }}>학습 콘텐츠</div>
              <div style={{ fontSize: 13, color: '#713F12', background: '#FEF9C3', borderRadius: 8, padding: '8px 12px', lineHeight: 1.6 }}>
                📚 고1·고2·고3 최근 5개년 기출 단어<br />📖 주요 시중 교재 단어집 순차 수록 중
              </div>
            </div>

            {/* 포함 기능 카드 */}
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E0F2FE', marginBottom: 16, boxShadow: '0 2px 8px rgba(8,145,178,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0891B2', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12 }}>포함 기능</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selfStudyPlanFeatures.map((f) => (
                  <div key={f} className="allkill-price-feature" style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.gray600 }}>
                    <span style={{ color: '#0891B2', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <div style={{ height: 1, background: '#F0F9FF', margin: '12px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selfStudyExclusions.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#CBD5E1', fontSize: 14 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, flexShrink: 0 }}>—</span> <span style={{ textDecoration: 'line-through' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 7단계 학습 시스템 카드 */}
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #E0F2FE', marginBottom: 28, flex: 1, boxShadow: '0 2px 8px rgba(8,145,178,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0891B2', textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12 }}>7단계 완벽 암기 시스템</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {proRoundSteps.map((s) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 900, color: 'white', background: s.round === 2 ? '#0891B2' : '#14B8A6', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>{s.step}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.gray600 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: C.gray400, marginLeft: 'auto' }}>{s.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <AllkillPayButton courseId={selfStudyCourseId} price={selfStudyCoursePrice} label="셀프 스터디 시작하기" />
          </div>

          {/* 1:1 온라인 관리 */}
          <div className="allkill-price-card" style={{ borderRadius: 20, padding: '40px 36px', border: `2px solid ${C.lavender}`, background: 'linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 40%)', boxShadow: '0 16px 48px rgba(167,139,250,0.18)', position: 'relative', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', color: 'white', fontSize: 13, fontWeight: 700, padding: '6px 20px', borderRadius: 100, whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>🔥 가장 인기</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #A78BFA, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="allkill-price-plan-label" style={{ color: C.lavenderDark, fontWeight: 700, marginBottom: 0 }}>1:1 온라인 관리</div>
            </div>
            <div className="allkill-montserrat allkill-price-amount" style={{ color: C.gray800 }}>월 66,000<span className="allkill-price-amount-unit" style={{ color: C.gray400 }}>원</span></div>
            <div className="allkill-price-discount" style={{ color: C.gray400 }}>
              <s style={{ color: 'rgba(0,0,0,0.3)' }}>정가 88,000원</s> → <b style={{ color: C.lavenderDark }}>얼리버드 특가</b>
            </div>

            {/* 선생님 관리 하이라이트 카드 */}
            <div style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', borderRadius: 14, padding: '18px 20px', marginBottom: 16, color: 'white' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12, opacity: 0.8 }}>선생님 1:1 관리</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['주 2회 온라인 시험 관리', '개별 진도 관리 (90점 통과 시스템)', '학부모 리포트 공유'].map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                    <span style={{ color: '#C4B5FD', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>★</span> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* 학습 콘텐츠 카드 */}
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #EDE9FE', marginBottom: 16, boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.lavenderDark, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 10 }}>학습 콘텐츠</div>
              <div style={{ fontSize: 13, color: '#713F12', background: '#FEF9C3', borderRadius: 8, padding: '8px 12px', lineHeight: 1.6 }}>
                📚 고1·고2·고3 최근 5개년 기출 단어<br />📖 주요 시중 교재 단어집 순차 수록 중
              </div>
            </div>

            {/* 포함 기능 카드 */}
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #EDE9FE', marginBottom: 16, boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.lavenderDark, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12 }}>셀프 스터디 기능 전부 포함 +</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['오답 관리 & 틀린 단어 복습', 'AI 서술형 채점'].map((f) => (
                  <div key={f} className="allkill-price-feature" style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.gray600 }}>
                    <span style={{ color: C.lavenderDark, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
              </div>
            </div>

            {/* 7단계 학습 시스템 카드 */}
            <div style={{ background: 'white', borderRadius: 14, padding: '16px 18px', border: '1px solid #EDE9FE', marginBottom: 28, flex: 1, boxShadow: '0 2px 8px rgba(124,58,237,0.06)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.lavenderDark, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 12 }}>7단계 완벽 암기 시스템</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {proRoundSteps.map((s) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 900, color: 'white', background: s.round === 2 ? C.lavenderDark : C.lavender, borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>{s.step}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.gray600 }}>{s.name}</span>
                    <span style={{ fontSize: 11, color: C.gray400, marginLeft: 'auto' }}>{s.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <AllkillPayButton courseId={vocaCourseId} price={vocaCoursePrice} />
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
            <a
              href={KAKAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full text-center px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-200 hover:opacity-90 hover:scale-[1.02]"
              style={{ background: '#FEE500', color: '#3C1E1E' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.48 3 2 6.54 2 10.84c0 2.77 1.86 5.21 4.66 6.6-.15.53-.96 3.4-.99 3.62 0 0-.02.17.09.24.11.06.24.01.24.01.32-.05 3.7-2.44 4.28-2.86.55.08 1.13.13 1.72.13 5.52 0 10-3.54 10-7.84S17.52 3 12 3" /></svg>
              카톡으로 문의하기
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}
