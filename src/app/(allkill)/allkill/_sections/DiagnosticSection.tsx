import { TrackLink } from '@/components/analytics/track-link';
import { C } from '../_data';

/**
 * 무료 어휘 레벨 진단 섹션 — 학부모 섹션과 가격 섹션 사이의 다리.
 * "○○ 수준" 학년 주장 대신 "지금 시작할 교재" 라인업 프레임 (2026-07-23 확정 기획):
 * 미니 라인업 그림으로 결과 화면을 미리 보여주고 /level-test로 보낸다.
 * 중앙 정렬 (7단계·차별점 섹션과 동일 리듬).
 */

/** 결과 화면 라인업의 축소판 — 실명 교재로 "어느 교재에서 시작할지"를 그림으로 보여준다 */
const MINI_LINEUP: { grade: string; book: string; mine?: boolean }[] = [
  { grade: '중1', book: '천일문 보카 중등 스타트' },
  { grade: '중2', book: '능률 VOCA 중등 필수', mine: true },
  { grade: '중3', book: '워드마스터 중등 고난도' },
  { grade: '고1', book: '능률 고교필수 2000' },
  { grade: '고2', book: '고2 3월 모고 단어' },
  { grade: '고3', book: '고3 3월 모고 단어' },
];

export default function DiagnosticSection() {
  return (
    <section className="ak-section" style={{ padding: '96px 24px', background: C.blueLight, textAlign: 'center' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <span className="ak-badge" style={{ background: 'white', color: C.blueDark }}>무료 레벨 진단</span>
        <h2 className="ak-h2" style={{ color: C.ink }}>
          우리 아이에게 맞는 단어장,<br />
          <span style={{ color: C.blue }}>5분</span>이면 나옵니다<span style={{ color: C.blue }}>.</span>
        </h2>
        <p className="ak-sub" style={{ color: C.gray }}>
          학년을 고르면 문제가 레벨을 오르내리며,
          <b style={{ color: C.ink }}> 천일문부터 수능 기출까지 어느 교재에서 시작할지</b> 찾아드려요.
          한 달 뒤 재진단으로 정답률이 얼마나 올랐는지도 비교해드려요.
        </p>

        {/* 초등 데이터 한 줄 — 교과서 단어 DB 교차 분석 (40% = 중1 교과서 단어 350개 중 천일문 스타트 수록 비율) */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: 'white', border: `1px solid ${C.line}`, borderRadius: 100, padding: '10px 22px' }}>
          <span style={{ fontSize: 14 }}>🎒</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.gray, wordBreak: 'keep-all' }}>
            초등학생도 바로 진단 — 추천 교재에는 <b style={{ color: C.blue }}>중1 교과서 단어의 40%</b>가 담겨 있어요
          </span>
        </div>

        {/* 미니 라인업 — 진단 결과 화면 예시 (내 시작 칸 하이라이트) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 44 }}>
          <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 24, padding: '26px 24px', width: '100%', maxWidth: 560, boxShadow: '0 16px 40px rgba(26,115,232,0.14)' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.blueDark, marginBottom: 4 }}>진단 결과 (예시)</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 16, wordBreak: 'keep-all' }}>
              지금 시작할 교재는 <span style={{ color: C.blue }}>능률 VOCA 중등 필수</span>
            </p>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {MINI_LINEUP.map((col) => (
                <div
                  key={col.grade}
                  style={{
                    flexShrink: 0,
                    width: 104,
                    borderRadius: 14,
                    border: col.mine ? `2px solid ${C.blue}` : `1px solid ${C.line}`,
                    background: col.mine ? C.blueLight : 'white',
                    padding: '10px 8px',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 800, color: col.mine ? C.blueDark : C.grayLight, marginBottom: 6 }}>
                    {col.grade}
                  </p>
                  {col.mine && (
                    <span style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, color: 'white', background: C.blue, borderRadius: 100, padding: '2px 8px', marginBottom: 6 }}>
                      내 시작 칸
                    </span>
                  )}
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: col.mine ? C.ink : C.gray, lineHeight: 1.35, wordBreak: 'keep-all' }}>
                    {col.book}
                  </p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left' }}>
              {[
                ['start', '시중 교재 실명으로 시작 위치 추천'],
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

        {/* CTA — 미니 라인업으로 결과를 보여준 뒤 행동 유도 */}
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <TrackLink event="landing_diagnostic_click" href="/level-test" className="ak-btn ak-btn-primary">
            가입 없이 바로 진단 시작
          </TrackLink>
          <p style={{ fontSize: 13, color: C.grayLight }}>
            가입 없이 시작 · 5분 · 결과 볼 때만 10초 가입
          </p>
        </div>
      </div>
    </section>
  );
}
