import Link from 'next/link';
import AllkillPayButton from '@/components/public/allkill-pay-button';
import { TrackLink } from '@/components/analytics/track-link';
import { C, freePlanFeatures, selfStudyPlanFeatures, proPlanFeatures, academyFeatures } from '../_data';

const KAKAO_URL = 'http://pf.kakao.com/_iLxcLG/chat';

interface PricingSectionProps {
  vocaCourseId?: string;
  vocaCoursePrice?: number;
  selfStudyCourseId?: string;
  selfStudyCoursePrice?: number;
  passCourseId?: string;
  passCoursePrice?: number;
}

function FeatureList({ items, checkColor }: { items: string[]; checkColor: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, flex: 1 }}>
      {items.map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 16, color: C.gray, lineHeight: 1.55 }}>
          <span style={{ color: checkColor, fontWeight: 800, flexShrink: 0 }}>✓</span> {item}
        </div>
      ))}
    </div>
  );
}

export default function PricingSection({ vocaCourseId, vocaCoursePrice, selfStudyCourseId, selfStudyCoursePrice, passCourseId, passCoursePrice }: PricingSectionProps) {
  return (
    <section id="price" className="ak-section" style={{ padding: '96px 24px', background: C.sky }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <span className="ak-badge ak-badge-onsky">가격</span>
        <h2 className="ak-h2" style={{ color: C.ink }}>
          부담 없이 <span style={{ color: C.blue }}>시작하세요</span>
        </h2>
        <p className="ak-sub" style={{ color: C.gray }}>
          가입 후 7일간 보카 전체가 무료예요. 해보고 결정하세요.
        </p>

        <div className="ak-price-grid" style={{ marginTop: 52 }}>

          {/* 무료 체험 */}
          <div className="ak-price-card">
            <div className="ak-price-head">
              <div style={{ fontSize: 15, fontWeight: 800, color: C.gray, marginBottom: 12 }}>무료 체험</div>
              <div className="ak-price-amount" style={{ color: C.ink }}>0<span className="ak-price-unit">원</span></div>
              <div style={{ fontSize: 14, color: C.grayLight }}>가입만 하면 바로 시작</div>
            </div>
            <FeatureList items={freePlanFeatures} checkColor={C.green} />
            <Link href="/signup" className="ak-btn ak-btn-ghost ak-price-btn">
              무료로 시작하기
            </Link>
          </div>

          {/* 셀프 스터디 — 월 / 6개월 패스 두 옵션 */}
          <div className="ak-price-card">
            <div className="ak-price-head">
              <div style={{ fontSize: 15, fontWeight: 800, color: C.blue, marginBottom: 12 }}>셀프 스터디</div>
              <div className="ak-price-amount" style={{ color: C.ink }}>월 19,900<span className="ak-price-unit">원</span></div>
              <div style={{ fontSize: 14, color: C.grayLight }}>선생님 없이 혼자서 완벽하게</div>
            </div>
            <FeatureList items={selfStudyPlanFeatures} checkColor={C.blue} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AllkillPayButton courseId={selfStudyCourseId} price={selfStudyCoursePrice} label="올킬보카 셀프학습" variant="outline" text="월 19,900원 시작하기" />
              <AllkillPayButton courseId={passCourseId} price={passCoursePrice} label="올킬보카 셀프학습 6개월 패스" variant="outline" text="6개월 패스 99,000원" />
              <p style={{ fontSize: 13, color: C.blue, fontWeight: 700, textAlign: 'center', margin: 0 }}>
                6개월 패스는 월 16,500원꼴 — 20,400원 아껴요
              </p>
            </div>
          </div>

          {/* 1:1 온라인 관리 */}
          <div className="ak-price-card" style={{ border: `2px solid ${C.blue}`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: C.blue, color: 'white', fontSize: 13, fontWeight: 800, padding: '5px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}>가장 인기</div>
            <div className="ak-price-head">
              <div style={{ fontSize: 15, fontWeight: 800, color: C.blue, marginBottom: 12 }}>1:1 온라인 관리</div>
              <div className="ak-price-amount" style={{ color: C.ink }}>월 66,000<span className="ak-price-unit">원</span></div>
              <div style={{ fontSize: 14, color: C.grayLight }}>
                <s>정가 88,000원</s> <b style={{ color: C.blue }}>얼리버드 특가</b>
              </div>
            </div>
            <FeatureList items={proPlanFeatures} checkColor={C.blue} />
            <AllkillPayButton courseId={vocaCourseId} price={vocaCoursePrice} label="올킬보카 1:1 온라인 관리" />
          </div>

          {/* 학원 단체 */}
          <div className="ak-price-card">
            <div className="ak-price-head">
              <div style={{ fontSize: 15, fontWeight: 800, color: C.gray, marginBottom: 12 }}>학원 단체</div>
              <div className="ak-price-amount" style={{ color: C.ink }}>월 27,900원<span className="ak-price-unit">부터</span></div>
              <div style={{ fontSize: 14, color: C.grayLight }}>학생 10명 기준 · 5명 단위 요금</div>
            </div>
            <FeatureList items={academyFeatures} checkColor={C.green} />
            <TrackLink
              event="academy_signup_click"
              href="/signup?role=admin&next=/pricing"
              className="ak-btn ak-price-btn"
              style={{ background: C.yellow, color: C.ink }}
            >
              학원 가입하고 시작하기
            </TrackLink>
            <a
              href={KAKAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', marginTop: 10, textAlign: 'center', fontSize: 13, color: C.grayLight, textDecoration: 'underline' }}
            >
              궁금한 점은 카톡으로 문의하기
            </a>
          </div>

        </div>

      </div>
    </section>
  );
}
