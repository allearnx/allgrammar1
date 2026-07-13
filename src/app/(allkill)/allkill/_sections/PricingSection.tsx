import Link from 'next/link';
import AllkillPayButton from '@/components/public/allkill-pay-button';
import { C, freePlanFeatures, selfStudyPlanFeatures, proPlanFeatures, academyFeatures } from '../_data';

const KAKAO_URL = 'http://pf.kakao.com/_iLxcLG/chat';

interface PricingSectionProps {
  vocaCourseId?: string;
  vocaCoursePrice?: number;
  selfStudyCourseId?: string;
  selfStudyCoursePrice?: number;
}

function FeatureList({ items, checkColor }: { items: string[]; checkColor: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, flex: 1 }}>
      {items.map((item) => (
        <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 15, color: C.gray, lineHeight: 1.5 }}>
          <span style={{ color: checkColor, fontWeight: 800, flexShrink: 0 }}>✓</span> {item}
        </div>
      ))}
    </div>
  );
}

export default function PricingSection({ vocaCourseId, vocaCoursePrice, selfStudyCourseId, selfStudyCoursePrice }: PricingSectionProps) {
  return (
    <section id="price" className="ak-section" style={{ padding: '96px 24px', background: C.sky }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <span className="ak-badge">가격</span>
        <h2 className="ak-h2" style={{ color: C.ink }}>
          부담 없이 <span style={{ color: C.blue }}>시작하세요</span>
        </h2>
        <p className="ak-sub" style={{ color: C.gray }}>
          교재당 Day 3개는 무료예요. 해보고 결정하세요.
        </p>

        <div className="ak-price-grid" style={{ marginTop: 52 }}>

          {/* 무료 체험 */}
          <div className="ak-price-card">
            <div style={{ fontSize: 15, fontWeight: 800, color: C.gray, marginBottom: 12 }}>무료 체험</div>
            <div className="ak-price-amount" style={{ color: C.ink }}>0<span className="ak-price-unit">원</span></div>
            <div style={{ fontSize: 14, color: C.grayLight, marginBottom: 24 }}>가입만 하면 바로 시작</div>
            <FeatureList items={freePlanFeatures} checkColor={C.green} />
            <Link href="/signup" className="ak-btn ak-btn-ghost" style={{ width: '100%' }}>
              무료로 시작하기
            </Link>
          </div>

          {/* 셀프 스터디 */}
          <div className="ak-price-card">
            <div style={{ fontSize: 15, fontWeight: 800, color: C.blue, marginBottom: 12 }}>셀프 스터디</div>
            <div className="ak-price-amount" style={{ color: C.ink }}>월 24,000<span className="ak-price-unit">원</span></div>
            <div style={{ fontSize: 14, color: C.grayLight, marginBottom: 24 }}>선생님 없이 혼자서 완벽하게</div>
            <FeatureList items={selfStudyPlanFeatures} checkColor={C.blue} />
            <AllkillPayButton courseId={selfStudyCourseId} price={selfStudyCoursePrice} label="올킬보카 셀프 스터디" variant="outline" />
          </div>

          {/* 1:1 온라인 관리 */}
          <div className="ak-price-card" style={{ border: `2px solid ${C.blue}`, position: 'relative' }}>
            <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: C.blue, color: 'white', fontSize: 13, fontWeight: 800, padding: '5px 18px', borderRadius: 100, whiteSpace: 'nowrap' }}>가장 인기</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.blue, marginBottom: 12 }}>1:1 온라인 관리</div>
            <div className="ak-price-amount" style={{ color: C.ink }}>월 66,000<span className="ak-price-unit">원</span></div>
            <div style={{ fontSize: 14, color: C.grayLight, marginBottom: 24 }}>
              <s>정가 88,000원</s> <b style={{ color: C.blue }}>얼리버드 특가</b>
            </div>
            <FeatureList items={proPlanFeatures} checkColor={C.blue} />
            <AllkillPayButton courseId={vocaCourseId} price={vocaCoursePrice} label="올킬보카 1:1 온라인 관리" />
          </div>

          {/* 학원 단체 */}
          <div className="ak-price-card">
            <div style={{ fontSize: 15, fontWeight: 800, color: C.gray, marginBottom: 12 }}>학원 단체</div>
            <div className="ak-price-amount" style={{ color: C.ink }}>문의</div>
            <div style={{ fontSize: 14, color: C.grayLight, marginBottom: 24 }}>학원·그룹 맞춤 견적</div>
            <FeatureList items={academyFeatures} checkColor={C.green} />
            <a
              href={KAKAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ak-btn"
              style={{ width: '100%', background: '#FEE500', color: '#3C1E1E' }}
            >
              카톡으로 문의하기
            </a>
          </div>

        </div>

        <p style={{ marginTop: 32, fontSize: 14, color: C.grayLight }}>
          결제 후 이용 방법이 궁금하세요?{' '}
          <Link href="/allkill/guide" style={{ color: C.gray, textDecoration: 'underline', fontWeight: 600 }}>이용 가이드 보기</Link>
        </p>
      </div>
    </section>
  );
}
