import type { Metadata } from 'next';
import { Noto_Serif_KR, Nanum_Pen_Script } from 'next/font/google';
import SinaeSinPayButton from '@/components/public/sinaesin-pay-button';
import ConsultationLink from '@/components/public/consultation-link';
import NaesinReviewCarousel from './review-carousel';
import { createAdminClient } from '@/lib/supabase/admin';

const notoSerif = Noto_Serif_KR({ weight: ['700'], subsets: ['latin'], preload: false });
const nanumPen = Nanum_Pen_Script({ weight: ['400'], preload: false });

export const metadata: Metadata = {
  title: '올인내신 | 상위권을 위한 영어 내신 대비',
  description: '95점에서 100점으로 가는 그 구간을 집중적으로 파고듭니다. 킬러 문제, 대치동 자료, AI 변형 문제 완벽 대비.',
};

const whyCards = [
  { num: 'Point 01', title: '킬러 문제에 강하다', desc: '상위권이 실제로 틀리는 문제만 집중합니다.\n기초 반복은 이제 그만.' },
  { num: 'Point 02', title: '자료의 퀄리티가 다릅니다', desc: '대치동 아이들이 쓰는 그 자료입니다.\n자료 받으러 학원가지 마세요.' },
  { num: 'Point 03', title: '오프라인보다 더 촘촘한 관리', desc: '오답, 학습 현황, 성취도까지 선생님이 파악합니다.\n학원보다 더 꼼꼼하게.' },
  { num: 'Point 04', title: '대형학원 수준의 학습량,\n그리고 더 나은 효율', desc: '양은 그대로, 쉬운 반복은 삭제.\n틀리는 문제 유형만 집중 반복합니다.' },
];

const curriculumSteps = [
  { step: '01', title: '단어 → 문법 → 본문 순서 지키기', desc: '중학 수준을 넘어서는 심화 문법까지 다루기 위해\n문법을 먼저 시작해야 합니다.\n여기서 최소 10점이 올라요.' },
  { step: '02', title: 'AI로 강화된 본문 변형 — 철저 대비', desc: '무작정 암기는 변형 문제에 취약합니다.\n어디가 중요한지를 알아야 어떤 변형이 나와도 대응할 수 있어요.' },
  { step: '03', title: '문법은 고등까지 — 시험이 실력 쌓는 기회', desc: '중학 문법에서 끝내지 마세요.\n고등 문법까지 깊이 있는 문제를 풀어야 고등 시험 범위를 감당할 수 있어요.' },
  { step: '04', title: '기출문제로 유형 익히기', desc: '문제집 문제 ≠ 기출문제.\n본인 학교보다 어려운 학군지 기출까지 풀어야 출제 유형에 익숙해집니다.' },
  { step: '05', title: '틀린 문제 집요하게 분석', desc: '답만 확인하고 넘어가면 안 됩니다.\n왜 틀렸는지 이유를 파악하고 외워야 진짜 실력이 됩니다.' },
];

const oldWay = [
  '기초 반복 위주 — 틀리는 문제 유형을 파고들지 않음',
  '본문 암기에만 집중 — 변형 문제에 취약',
  '중학 문법 수준에서 멈춤',
  '자료의 질이 학원마다 천차만별',
  '오답 관리가 학생 개인 몫',
];

const newWay = [
  '킬러 문제만 집중 — 상위권이 실제로 틀리는 유형 반복',
  'AI 변형 문제로 어떤 변형도 대응 가능',
  '고등 문법까지 — 수능·내신 완벽 대비',
  '대치동 수준의 자료, 온라인으로',
  '오답 자동 누적 & 선생님이 직접 관리',
];

const pricingItems = [
  ['녹화 강의', '교과서별·문법별, 언제든 다시 볼 수 있어요'],
  ['주 4회 그룹 온라인 클리닉', '함께 공부하고, 스케줄 점검하고, 오답을 선생님이 직접 설명합니다'],
  ['교과서 본문 암기', '자체 플랫폼으로 학습 현황 실시간 관리'],
  ['기출 문제 뱅크', '오답 자동 누적 및 재출제'],
  ['성취도 리포트', '학부모 공유 가능'],
];

export default async function SchoolExamPage() {
  const supabase = createAdminClient();
  const { data: examCourse } = await supabase
    .from('courses')
    .select('id, price, title')
    .eq('category', 'school_exam')
    .eq('is_active', true)
    .limit(1)
    .single();

  return (
    <>
      <style suppressHydrationWarning>{`
        :root {
          --navy: #1e1b4b; --navy2: #312e81;
          --indigo: #4338ca; --indigo-light: #6366f1; --indigo-soft: #eef2ff;
          --mint: #10b981; --mint-soft: #d1fae5;
          --text: #1e1b4b; --text-muted: #64748b; --text-light: #94a3b8;
          --border: #e2e8f0; --radius: 16px; --radius-lg: 24px;
        }
        .sinaesin-serif { font-family: ${notoSerif.style.fontFamily}, serif; }
        .sinaesin-hero {
          min-height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center; text-align: center;
          padding: 130px 24px 80px; background: #ffffff;
        }
        .sinaesin-proof {
          display: inline-block; font-size: 0.85rem; font-weight: 700;
          color: #8a6a2a; padding: 16px 48px; position: relative; margin-bottom: 14px;
        }
        .sinaesin-proof::before, .sinaesin-proof::after {
          content: ''; position: absolute; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, #c9a84c, #f0d080, #c9a84c, transparent);
        }
        .sinaesin-proof::before { top: 0; }
        .sinaesin-proof::after { bottom: 0; }
        .sinaesin-why-card {
          background: #ffffff; border: 1.5px solid #c9a84c; border-radius: var(--radius);
          padding: 32px 28px; transition: all 0.3s; position: relative; overflow: hidden;
          box-shadow: 0 4px 24px rgba(180,140,60,0.12), 0 1px 4px rgba(180,140,60,0.08);
        }
        .sinaesin-why-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, #c9a84c, #f0d080, #c9a84c, transparent);
        }
        .sinaesin-why-card:hover { box-shadow: 0 16px 48px rgba(180,140,60,0.2); transform: translateY(-5px); }
        .sinaesin-timeline::before {
          content: ''; position: absolute; left: 28px; top: 0; bottom: 0; width: 1px;
          background: linear-gradient(180deg, #c9a84c, rgba(201,168,76,0.1));
        }
        .sinaesin-feature-card {
          display: grid; grid-template-columns: 56px 1fr; gap: 28px; align-items: start;
          padding: 32px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
          position: relative; transition: all 0.3s;
        }
        .sinaesin-feature-card:last-child { border-bottom: none; }
        .sinaesin-feature-card:hover .sinaesin-feature-content { transform: translateX(4px); }
        .sinaesin-step {
          width: 56px; height: 56px; border-radius: 50%; background: var(--navy2);
          border: 1.5px solid #c9a84c; display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 700; color: #c9a84c; flex-shrink: 0;
          position: relative; z-index: 1; transition: all 0.3s;
        }
        .sinaesin-feature-card:hover .sinaesin-step { background: #c9a84c; color: var(--navy); }
        .sinaesin-feature-content { transition: transform 0.3s; }
        .sinaesin-pricing-cta {
          display: block; width: 100%; background: #3182F6; color: white; border: none;
          padding: 18px; border-radius: 12px; font-size: 1rem; font-weight: 700;
          cursor: pointer; font-family: inherit; margin-top: 28px; transition: all 0.25s;
          text-align: center; text-decoration: none; box-shadow: 0 4px 16px rgba(49,130,246,0.25);
        }
        .sinaesin-pricing-cta:hover { background: #1b6ef3; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(49,130,246,0.35); }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .sinaesin-anim { animation: fadeInUp 0.5s ease both; }
        @media (max-width: 768px) {
          .sinaesin-hero { padding: 100px 20px 60px; }
          .sinaesin-proof { padding: 16px 24px; }
          .sinaesin-proof-inner { flex-direction: column !important; gap: 12px !important; }
          .sinaesin-proof-divider { width: 24px !important; height: 1px !important; background: linear-gradient(90deg, transparent, #c9a84c, transparent) !important; border-radius: 0 !important; }
          .sinaesin-vs-grid { grid-template-columns: 1fr !important; }
          .sinaesin-vs-badge { display: none !important; }
          .sinaesin-pricing-body { padding: 28px 24px !important; }
          .sinaesin-pricing-top { padding: 28px 24px !important; }
          .sinaesin-feature-card { grid-template-columns: 44px 1fr; gap: 20px; }
          .sinaesin-step { width: 44px; height: 44px; font-size: 0.7rem; }
          .sinaesin-timeline::before { left: 22px; }
        }
      `}</style>

      <main style={{ fontFamily: "'Pretendard', sans-serif", background: '#ffffff', color: 'var(--text)', lineHeight: '1.7', overflowX: 'hidden' }}>

        {/* HERO */}
        <section className="sinaesin-hero">
          <div style={{ maxWidth: 800 }}>
            <div className="sinaesin-anim" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--indigo-soft)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--indigo)', padding: '6px 18px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 700, marginBottom: 40 }}>
              ✦ 올라영 × 올인내신
            </div>
            <p className="sinaesin-anim" style={{ fontFamily: nanumPen.style.fontFamily, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4, animationDelay: '0.08s' }}>
              온라인으로 내신이 된다고요?
            </p>
            <h1 className="sinaesin-anim" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-3px', color: 'var(--navy)', marginBottom: 4, animationDelay: '0.12s' }}>
              됩니다.
            </h1>
            <p className="sinaesin-anim" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', fontWeight: 900, color: '#a78bfa', letterSpacing: '-1.5px', marginBottom: 40, animationDelay: '0.16s' }}>
              그것도 아주 잘.
            </p>

            <div className="sinaesin-proof sinaesin-serif sinaesin-anim" style={{ animationDelay: '0.2s', padding: '20px 56px' }}>
              <div className="sinaesin-proof-inner" style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#7a5a1a', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>수강생 95% · 95점 달성</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#b8966a', letterSpacing: '0.1em', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>STUDENT ACHIEVEMENT</span>
                </div>
                <div className="sinaesin-proof-divider" style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', flexShrink: 0 }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700, color: '#7a5a1a', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>2026 동탄국제고 합격</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#b8966a', letterSpacing: '0.1em', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>DONGTAN INTERNATIONAL HIGH</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section style={{ padding: '96px 24px', background: '#f5f3ff' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#92784a', textTransform: 'uppercase' as const, background: '#fdf6e3', padding: '4px 12px', borderRadius: 100, marginBottom: 20, border: '1px solid #e8dcc8' }}>
              WHY 올인내신
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, lineHeight: 1.25, letterSpacing: '-0.5px', color: 'var(--navy)', marginBottom: 16 }}>
              상위권이 막히는 곳,<br /><span style={{ color: '#a78bfa' }}>거기를 집중적으로 파고듭니다.</span>
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.85, maxWidth: 520, wordBreak: 'keep-all' as const }}>
              기초를 잘 가르치는 곳은 많아요.<br />
              <span style={{ whiteSpace: 'nowrap' }}>올인내신은 95점에서 100점으로 가는 그 구간을 다룹니다.</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginTop: 56 }}>
              {whyCards.map((card) => (
                <div key={card.num} className="sinaesin-why-card">
                  <div className="sinaesin-serif" style={{ fontSize: '0.68rem', fontWeight: 700, color: '#92784a', letterSpacing: '0.15em', textTransform: 'uppercase' as const, marginBottom: 14, display: 'inline-block', paddingBottom: 10, borderBottom: '1px solid #e8dcc8', width: '100%' }}>
                    {card.num}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy)', marginBottom: 10, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{card.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CURRICULUM */}
        <section style={{ padding: '64px 24px', background: 'var(--navy)' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#c9a84c', textTransform: 'uppercase' as const, background: 'rgba(201,168,76,0.15)', padding: '4px 12px', borderRadius: 100, marginBottom: 16, border: '1px solid rgba(201,168,76,0.3)' }}>
              커리큘럼
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, lineHeight: 1.25, color: 'white', marginBottom: 12 }}>
              내신 1등급의<br /><span style={{ color: '#a78bfa' }}>순서가 있습니다.</span>
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.85, maxWidth: 520 }}>
              순서가 틀리면 시간 낭비입니다.<br />올인내신은 검증된 순서대로 가르칩니다.
            </p>
            <div className="sinaesin-timeline" style={{ display: 'flex', flexDirection: 'column', gap: 0, marginTop: 32, position: 'relative' }}>
              {curriculumSteps.map((item) => (
                <div key={item.step} className="sinaesin-feature-card" style={{ padding: '20px 0' }}>
                  <div className="sinaesin-step sinaesin-serif">{item.step}</div>
                  <div className="sinaesin-feature-content">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'white', marginBottom: 6, lineHeight: 1.4 }}>{item.title}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, whiteSpace: 'pre-line', wordBreak: 'keep-all' as const }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMPARE */}
        <section style={{ padding: '96px 24px', background: 'white' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--indigo)', textTransform: 'uppercase' as const, background: 'var(--indigo-soft)', padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
              비교
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, lineHeight: 1.25, color: 'var(--navy)', marginBottom: 16 }}>
              목표는 하나.<br /><span style={{ color: '#a78bfa' }}>고등 내신 1등급, 수능 1등급.</span>
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.85, maxWidth: 520, marginBottom: 56 }}>
              중3이 끝날 때 그 기반이 완성되어야 합니다.<br />올인내신은 거기까지 봅니다.
            </p>

            <div className="sinaesin-vs-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, alignItems: 'center' }}>
              <div style={{ background: '#f8fafc', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px 32px' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-light)', textTransform: 'uppercase' as const, marginBottom: 20 }}>기존 방식</div>
                {oldWay.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#ef4444', flexShrink: 0, marginTop: 1, fontWeight: 900 }}>&#x2717;</div>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65, wordBreak: 'keep-all' as const }}>{item}</span>
                  </div>
                ))}
              </div>
              <div className="sinaesin-vs-badge" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.82rem', fontWeight: 900, letterSpacing: '0.05em' }}>VS</div>
              </div>
              <div style={{ background: 'var(--navy)', border: '1.5px solid rgba(201,168,76,0.4)', borderRadius: 'var(--radius-lg)', padding: '36px 32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #c9a84c, #f0d080, #c9a84c, transparent)' }} />
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: '#c9a84c', textTransform: 'uppercase' as const, marginBottom: 20 }}>올인내신</div>
                {newWay.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#c9a84c', flexShrink: 0, marginTop: 1, fontWeight: 900 }}>&#x2713;</div>
                    <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, wordBreak: 'keep-all' as const }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 48, padding: '28px 24px', background: 'var(--indigo-soft)', borderRadius: 'var(--radius)', textAlign: 'center', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: 700, color: 'var(--navy)', lineHeight: 1.7, wordBreak: 'keep-all' as const }}>
                중3이 끝날 때,{' '}
                <span style={{ color: 'var(--indigo-light)' }}>고등 영어의 기반이 완성</span>되어야 합니다.
              </p>
              <p style={{ marginTop: 8, fontWeight: 400, fontSize: '0.95rem', color: 'var(--text-muted)', wordBreak: 'keep-all' as const, lineHeight: 1.7 }}>
                올인내신은 그 기반을 온라인에서 만들어 드립니다.
              </p>
            </div>
          </div>
        </section>

        {/* REVIEW */}
        <section style={{ padding: '96px 24px', background: '#f5f3ff' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: '#92784a', textTransform: 'uppercase' as const, background: '#fdf6e3', padding: '4px 12px', borderRadius: 100, marginBottom: 20, border: '1px solid #e8dcc8' }}>
              수강 후기
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, lineHeight: 1.25, letterSpacing: '-0.5px', color: 'var(--navy)', marginBottom: 16 }}>
              직접 경험한 학부모님들의<br /><span style={{ color: '#a78bfa' }}>생생한 후기입니다.</span>
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.85, maxWidth: 520, marginBottom: 56, wordBreak: 'keep-all' as const }}>
              카카오톡으로 전해진 실제 후기를 그대로 공개합니다.
            </p>
            <NaesinReviewCarousel />
          </div>
        </section>

        {/* PRICING */}
        <section style={{ padding: '96px 24px', background: '#f8f7ff', textAlign: 'center' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--indigo)', textTransform: 'uppercase' as const, background: 'var(--indigo-soft)', padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
              가격 안내
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, lineHeight: 1.25, color: 'var(--navy)', marginBottom: 16 }}>
              명확하게, 딱 이만큼입니다.
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.85, margin: '0 auto', maxWidth: 520 }}>
              숨겨진 비용 없이, 4주 단위로 운영됩니다.
            </p>

            <div style={{ maxWidth: 520, margin: '56px auto 0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: '0 8px 48px rgba(30,27,75,0.12)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="sinaesin-pricing-top" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', padding: '44px 44px 36px', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', top: -80, right: -80 }} />
                <h3 className="sinaesin-serif" style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' as const, marginBottom: 20, position: 'relative' }}>
                  올인내신 · 4주 수강료
                </h3>
                <div style={{ fontSize: '3.4rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-2px', position: 'relative' }}>&#x20A9;180,000</div>
                <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: 8, position: 'relative' }}>교재비 별도</div>
                <div style={{ display: 'inline-block', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 700, padding: '4px 14px', borderRadius: 100, marginTop: 14, position: 'relative' }}>
                  ✦ 4주 완성 프로그램
                </div>
              </div>
              <div className="sinaesin-pricing-body" style={{ background: 'white', padding: '40px 44px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-light)', textTransform: 'uppercase' as const, marginBottom: 20 }}>포함 항목</div>
                {pricingItems.map(([title, desc]) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--mint-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--mint)', flexShrink: 0, marginTop: 2, fontWeight: 900 }}>&#x2713;</div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, wordBreak: 'keep-all' as const, textAlign: 'left' }}>
                      <strong style={{ color: 'var(--navy)' }}>{title}</strong> — {desc}
                    </span>
                  </div>
                ))}
                <SinaeSinPayButton courseId={examCourse?.id} price={examCourse?.price} name={examCourse?.title} />
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section style={{ padding: '96px 24px', background: 'white', textAlign: 'center' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--indigo)', textTransform: 'uppercase' as const, background: 'var(--indigo-soft)', padding: '4px 12px', borderRadius: 100, marginBottom: 20 }}>
              문의
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, lineHeight: 1.25, color: 'var(--navy)', marginBottom: 16 }}>
              우리 아이한테 맞을지<br />먼저 물어보세요.
            </h2>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.85, margin: '0 auto', maxWidth: 520 }}>
              커리큘럼, 학습 방식, 현재 수준에서 시작 가능한지 — 무엇이든 편하게 물어보세요.
            </p>
            <ConsultationLink
              className="inline-flex items-center gap-2.5 mt-9 px-9 py-4 rounded-xl text-base font-bold text-white transition-all hover:translate-y-[-1px]"
            >
              <span style={{ background: 'var(--navy)', padding: '16px 36px', borderRadius: 12, boxShadow: '0 4px 20px rgba(30,27,75,0.18)', display: 'inline-block' }}>
                문의하기 &rarr;
              </span>
            </ConsultationLink>
            <p style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-light)' }}>평일 AM 10:00 – PM 5:00 · 주말·공휴일 휴무</p>
          </div>
        </section>

      </main>
    </>
  );
}
