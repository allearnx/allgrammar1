import Link from 'next/link';
import { C } from '../_data';

/**
 * 무료 어휘 레벨 진단 섹션 — 학부모 섹션과 가격 섹션 사이의 다리.
 * "우리 아이 레벨부터 확인" → 가입 → 진단 → 결과 화면의 결제 CTA로 이어지는 퍼널 입구.
 * 중앙 정렬 (7단계·차별점 섹션과 동일 리듬), 목업 카드는 카피 아래 중앙 배치.
 */
export default function DiagnosticSection() {
  return (
    <section className="ak-section" style={{ padding: '96px 24px', background: C.blueLight, textAlign: 'center' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <span className="ak-badge" style={{ background: 'white', color: C.blueDark }}>무료 레벨 진단</span>
        <h2 className="ak-h2" style={{ color: C.ink }}>
          우리 아이 어휘 레벨,<br />
          <span style={{ color: C.blue }}>5분</span>이면 나옵니다<span style={{ color: C.blue }}>.</span>
        </h2>
        <p className="ak-sub" style={{ color: C.gray }}>
          학년을 고르면 문제가 레벨을 오르내리며 정확한 어휘 수준을 찾아요.
          <b style={{ color: C.ink }}> 모의고사 단어를 몇 %나 아는지</b> 숫자로 확인하고,
          한 달 뒤 얼마나 늘었는지도 비교해드려요.
        </p>

        {/* 진단 결과 목업 카드 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 44 }}>
          <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 24, padding: '30px 32px', width: '100%', maxWidth: 360, boxShadow: '0 16px 40px rgba(26,115,232,0.14)', textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.blueDark, marginBottom: 10 }}>진단 결과 (예시)</p>
            <p className="ak-display" style={{ fontSize: 44, color: C.blue, lineHeight: 1.1, marginBottom: 8 }}>중3</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.red, marginBottom: 20 }}>고1 기준 · 학년보다 1단계 아래예요</p>
            <div style={{ background: C.blueLight, borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 13, color: C.gray, marginBottom: 4 }}>고1 3월 모의고사 단어 커버리지</p>
              <p className="ak-display" style={{ fontSize: 34, color: C.ink, lineHeight: 1.1 }}>63%</p>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              {[
                ['missed', '놓친 단어까지 바로 확인'],
                ['delta', '한 달 뒤 재진단으로 성장 비교'],
              ].map(([key, text]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: C.greenLight, color: C.green, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.gray }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA — 목업으로 결과를 보여준 뒤 행동 유도 */}
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Link href="/signup?next=/student/voca/diagnostic" className="ak-btn ak-btn-primary">
            무료로 레벨 진단 받기
          </Link>
          <p style={{ fontSize: 13, color: C.grayLight }}>
            가입만 하면 바로 진단 · 5분 · 카드 등록 없음
          </p>
        </div>
      </div>
    </section>
  );
}
