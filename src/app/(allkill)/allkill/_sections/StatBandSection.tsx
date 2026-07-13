import { C, statBand } from '../_data';

/** 히어로 직하 구글 4색 큰 숫자 밴드 — 원비온다 패밀리 스타일 */
export default function StatBandSection() {
  return (
    <section style={{ background: 'white', padding: '64px 24px' }}>
      <div className="ak-statband" style={{ maxWidth: 1080, margin: '0 auto' }}>
        {statBand.map((stat) => (
          <div key={stat.num} style={{ textAlign: 'center' }}>
            <div className="ak-display" style={{ fontSize: 'clamp(36px, 4.5vw, 56px)', color: stat.color, lineHeight: 1.1, marginBottom: 10, letterSpacing: '-1px' }}>
              {stat.num}
            </div>
            <div style={{ fontSize: 'clamp(14px, 1.5vw, 17px)', fontWeight: 600, color: C.gray, wordBreak: 'keep-all' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
