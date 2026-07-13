import { C, reportRows } from '../_data';

const PARENT_POINTS = [
  '단계별 통과 현황과 점수를 한눈에',
  '어떤 단어를 몇 번 틀렸는지 상세 확인',
  '앱 설치 없이 링크 하나로 열려요',
];

/** 학부모 한 컷 — 카피 + 리포트 미리보기 딱 하나 */
export default function ParentSection() {
  return (
    <section className="ak-section" style={{ padding: '96px 24px', background: 'white' }}>
      <div className="ak-parent-grid" style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div>
          <span className="ak-badge">학부모</span>
          <h2 className="ak-h2" style={{ color: C.ink, textAlign: 'left' }}>
            우리 아이가 진짜 외웠는지,<br />
            <span style={{ color: C.blue }}>링크 하나로 확인하세요</span>
          </h2>
          <p className="ak-subfont" style={{ fontSize: 'clamp(16px, 1.8vw, 20px)', color: C.gray, lineHeight: 1.8, margin: '20px 0 32px', wordBreak: 'keep-all' }}>
            &ldquo;공부했어요&rdquo;라는 말 대신, 오늘 몇 단계를 통과했고
            어떤 단어에서 막혔는지 데이터로 보여드려요.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {PARENT_POINTS.map((point) => (
              <div key={point} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 17, color: C.ink, fontWeight: 600 }}>
                <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.greenLight, color: C.green, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>
                {point}
              </div>
            ))}
          </div>
        </div>

        {/* 리포트 미리보기 */}
        <div style={{ background: C.sky, borderRadius: 24, padding: '36px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 18, padding: '26px 28px', width: '100%', maxWidth: 340, boxShadow: '0 12px 32px rgba(31,31,31,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>이번 주 학습 리포트</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.blueDark, background: C.blueLight, padding: '3px 10px', borderRadius: 100 }}>실시간</span>
            </div>
            {reportRows.map((row) => (
              <div key={row.label} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, color: row.done ? C.green : C.blue, fontWeight: 700 }}>{row.pct}</span>
                </div>
                <div style={{ height: 6, background: C.line, borderRadius: 100 }}>
                  <div style={{ height: '100%', width: row.pct, background: row.done ? C.green : C.blue, borderRadius: 100 }} />
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}`, fontSize: 12, color: C.grayLight, textAlign: 'center' }}>
              링크 하나로 바로 공유
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
