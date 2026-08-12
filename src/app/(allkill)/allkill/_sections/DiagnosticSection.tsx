import { TrackLink } from '@/components/analytics/track-link';
import { LINEUP_ACCENTS, type LineupColumnKey } from '@/lib/voca/diagnostic-lineup';
import { C } from '../_data';

/**
 * 무료 어휘 레벨 진단 섹션 — 학부모 섹션과 가격 섹션 사이의 다리.
 * "○○ 수준" 학년 주장 대신 "지금 시작할 교재" 라인업 프레임 (2026-07-23 확정 기획):
 * 미니 라인업 그림으로 결과 화면을 미리 보여주고 /level-test로 보낸다.
 * 중앙 정렬 (7단계·차별점 섹션과 동일 리듬).
 */

/**
 * 결과 화면 라인업의 축소판 — 실명 교재로 "어느 교재에서 시작할지"를 그림으로 보여준다.
 * 2026-08-12 개편 미러: 칸 안 교재 전부 표시(첫 번째=대표), 초등800·교과서 단어는 기준점.
 * 모고 단어장 이름만 축약 ("최근 N개년" 생략) — 미니 그림 가독성.
 */
const MINI_LINEUP: { key: LineupColumnKey; grade: string; books: string[]; anchors: string[]; mine?: boolean }[] = [
  { key: 'elem', grade: '초등', books: ['초등 필수 영어단어 800', '천일문 보카 중등 스타트'], anchors: [] },
  { key: 'm1', grade: '중1', books: ['천일문 보카 중등 스타트'], anchors: ['중1 교과서 단어'] },
  { key: 'm2', grade: '중2', books: ['능률 VOCA 중등 필수'], anchors: ['중2 교과서 단어'], mine: true },
  { key: 'm3', grade: '중3', books: ['워드마스터 중등 고난도', '능률 VOCA 중등 고난도'], anchors: ['중3 교과서 단어'] },
  {
    key: 'h1',
    grade: '고1',
    books: ['능률 고교필수 2000', '고1 3월 모고 단어', '고1 6월 모고 단어', '고1 9월 모고 단어', '고1 ybm김'],
    anchors: [],
  },
  {
    key: 'h2',
    grade: '고2',
    books: ['고2 3월 모고 단어', '고2 6월 모고 단어', '고2 9월 모고 단어', '해커스 보카 어원'],
    anchors: [],
  },
  { key: 'h3', grade: '고3', books: ['고3 3월 모고 단어', '고3 6월 모고 단어', '고3 9월 모고 단어'], anchors: [] },
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
          <b style={{ color: C.ink }}> 초등 단어부터 수능 기출까지 어느 교재에서 시작할지</b> 찾아드려요.
          한 달 뒤 재진단으로 정답률이 얼마나 올랐는지도 비교해드려요.
        </p>

        {/* 초등 데이터 한 줄 — 교과서 단어 DB 교차 분석 (40% = 중1 교과서 단어 350개 중 천일문 스타트 수록 비율) */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 20, background: 'white', border: `1px solid ${C.line}`, borderRadius: 100, padding: '10px 22px' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: C.gray, wordBreak: 'keep-all' }}>
            초등학생도 바로 진단 — 추천 교재에는 <b style={{ color: C.ink }}>중1 교과서 단어의 40%</b>가 담겨 있어요
          </span>
        </div>

        {/* 미니 라인업 — 진단 결과 화면 예시 (내 시작 칸 하이라이트) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 44 }}>
          <div style={{ background: 'white', border: `1px solid ${C.line}`, borderRadius: 24, padding: '26px 24px', width: '100%', maxWidth: 720, boxShadow: '0 16px 40px rgba(60,64,67,0.12)' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: C.grayLight, marginBottom: 4 }}>진단 결과 (예시)</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 16, wordBreak: 'keep-all' }}>
              지금 시작할 교재는 <span style={{ color: LINEUP_ACCENTS.m2.deep }}>능률 VOCA 중등 필수</span>
            </p>
            {/* 칸마다 다른 색 + 단계 번호 — 파랑 일색을 피하고 난이도 순서를 눈에 보이게 (2026-08-12) */}
            {/* minmax(180px) — 이 카드 폭(720)에서 정확히 3열(3+3)로 떨어지고, 모바일에선 1열로 접힌다 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {MINI_LINEUP.map((col, step) => {
                const accent = LINEUP_ACCENTS[col.key];
                return (
                  <div
                    key={col.key}
                    style={{
                      borderRadius: 12,
                      border: col.mine ? `2px solid ${accent.vivid}` : `1px solid ${C.line}`,
                      background: 'white',
                      overflow: 'hidden',
                      textAlign: 'left',
                    }}
                  >
                    {/* 칸 색은 상단 바로만 — 결과 화면 카드와 동일 규칙 */}
                    <div style={{ height: 3, background: accent.vivid }} />
                    <div style={{ padding: '10px 12px 13px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: accent.deep }}>{step + 1}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{col.grade}</span>
                      {col.mine && (
                        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: accent.deep }}>
                          내 시작 칸
                        </span>
                      )}
                    </div>
                    {col.books.map((book, i) => (
                      <p
                        key={book}
                        style={{
                          fontSize: 11.5,
                          // 첫 번째 = 칸 대표 — 굵게, 나머지 병렬은 한 톤 낮게
                          fontWeight: i === 0 ? 700 : 500,
                          color: i === 0 ? C.ink : C.grayLight,
                          lineHeight: 1.35,
                          wordBreak: 'keep-all',
                          marginTop: i === 0 ? 0 : 5,
                        }}
                      >
                        {book}
                      </p>
                    ))}
                    {/* 우리 교재 — 라벨 없이 맨 아래 옅게 (결과 화면과 동일 규칙) */}
                    {col.anchors.length > 0 && (
                      <div style={{ marginTop: 8, paddingTop: 7, borderTop: `1px dashed ${C.line}` }}>
                        {col.anchors.map((anchor) => (
                          <p key={anchor} style={{ fontSize: 10.5, fontWeight: 500, color: C.grayLight, lineHeight: 1.35, wordBreak: 'keep-all', marginTop: 2 }}>
                            {anchor}
                          </p>
                        ))}
                      </div>
                    )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* 체크 아이콘 원형 배지 → 담백한 한 줄 (장식 요소 정리, 2026-08-12) */}
            <p style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}`, fontSize: 13.5, fontWeight: 600, color: C.gray, textAlign: 'left', wordBreak: 'keep-all' }}>
              시중 교재 실명으로 시작 위치를 추천하고, 한 달 뒤 재진단으로 성장을 비교해드려요.
            </p>
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
