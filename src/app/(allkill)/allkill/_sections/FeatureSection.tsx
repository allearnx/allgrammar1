import { C, features, reportRows } from '../_data';

/** 각 차별점의 미니 비주얼 — 텍스트 벽 대신 화면 미리보기 한 조각씩 */
function FeatureVisual({ featureKey }: { featureKey: string }) {
  if (featureKey === 'exam') {
    return (
      <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 16, padding: '20px 22px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: C.ink }}>reduce</span>
          <span style={{ fontSize: 14, color: C.gray }}>줄이다, 감소시키다</span>
        </div>
        <p style={{ fontSize: 14, color: C.gray, lineHeight: 1.6, marginBottom: 12, wordBreak: 'keep-all' }}>
          Small daily habits can <b style={{ color: C.blue }}>reduce</b> stress more than we expect.
        </p>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.blueDark, background: C.blueLight, padding: '4px 12px', borderRadius: 100 }}>
          📄 2024년 3월 고1 모의고사
        </span>
      </div>
    );
  }
  if (featureKey === 'wrong') {
    return (
      <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 16, padding: '20px 22px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.gray, marginBottom: 14, textAlign: 'left' }}>틀린 단어 졸업 조건</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {['1회 정답', '2회 정답', '3회 정답'].map((label) => (
            <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.green, background: C.greenLight, padding: '7px 14px', borderRadius: 100 }}>
              ✓ {label}
            </span>
          ))}
          <span style={{ fontSize: 13, fontWeight: 800, color: 'white', background: C.blue, padding: '7px 16px', borderRadius: 100 }}>졸업 🎉</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 16, padding: '20px 22px' }}>
      {reportRows.map((row) => (
        <div key={row.label} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 13, color: C.gray, fontWeight: 600 }}>{row.label}</span>
            <span style={{ fontSize: 13, color: row.done ? C.green : C.blue, fontWeight: 700 }}>{row.pct}</span>
          </div>
          <div style={{ height: 6, background: C.line, borderRadius: 100 }}>
            <div style={{ height: '100%', width: row.pct, background: row.done ? C.green : C.blue, borderRadius: 100 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FeatureSection() {
  return (
    <section className="ak-section" style={{ padding: '96px 24px', background: C.sky }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center' }}>
        <span className="ak-badge">차별점</span>
        <h2 className="ak-h2" style={{ color: C.ink }}>
          다른 단어장엔 없는 <span style={{ color: C.blue }}>세 가지</span>
        </h2>

        <div className="ak-feature-grid" style={{ marginTop: 52 }}>
          {features.map((feature) => (
            <div key={feature.key} className="ak-feature-card">
              <span style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 800, color: C.blueDark, background: C.blueLight, padding: '5px 14px', borderRadius: 100, marginBottom: 18 }}>{feature.tag}</span>
              <h3 style={{ fontSize: 'clamp(19px, 2vw, 23px)', fontWeight: 900, color: C.ink, lineHeight: 1.4, marginBottom: 12, whiteSpace: 'pre-line', textAlign: 'left' }}>{feature.title}</h3>
              <p style={{ fontSize: 15, color: C.gray, lineHeight: 1.75, marginBottom: 24, wordBreak: 'keep-all', textAlign: 'left' }}>{feature.body}</p>
              <div style={{ marginTop: 'auto' }}>
                <FeatureVisual featureKey={feature.key} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
