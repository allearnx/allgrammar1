import { Nanum_Pen_Script } from 'next/font/google';
import { C } from '../_data';

const nanumPen = Nanum_Pen_Script({ weight: ['400'], preload: false });

export default function HeroSection() {
  return (
    <section className="allkill-hero-section" style={{ minHeight: '60vh', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 60px 80px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'rgba(167,139,250,0.06)', top: -200, right: -200, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(167,139,250,0.05)', bottom: -100, left: '10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'rgba(77,217,192,0.08)', top: '30%', left: '45%', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: C.lavenderLight, border: `1.5px solid ${C.lavender}`, color: C.lavenderDark, fontSize: 15, fontWeight: 700, padding: '8px 20px', borderRadius: 100, marginBottom: 28, letterSpacing: '0.3px' }}>
          ✦ <span style={{ color: C.mintDark }}>올라영</span> × 올킬보카
        </div>

        <h1 className="allkill-hero-title" style={{ fontSize: 84, fontWeight: 900, color: C.gray800, lineHeight: 1.15, marginBottom: 24 }}>
          <span style={{ color: '#A78BFA' }}>올킬보카</span>만의 7단계 학습<br />
          <span style={{ color: '#A78BFA' }}>진짜 내 단어</span>로<br />
          만드세요.
        </h1>

        <p className="allkill-hero-desc" style={{ fontFamily: nanumPen.style.fontFamily, fontSize: 64, color: 'rgba(0,0,0,0.82)', lineHeight: 1.8, marginTop: 32, marginBottom: 40, textAlign: 'center' }}>
          방금 시험봤는데 돌아서면 대답을 못하는 아이들.<br />
          이제는 그만.
        </p>
      </div>
    </section>
  );
}
