import { statsItems } from '../_data';

export default function StatsSection() {
  return (
    <div className="allkill-stats-section" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', padding: '80px 60px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -120, right: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,217,192,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="allkill-stats-inner" style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="allkill-stats-text">
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 44px)', fontWeight: 900, color: 'white', marginBottom: 12, lineHeight: 1.3 }}>지금 이 순간도<br />단어를 올킬 중</h2>
          <p style={{ fontSize: 'clamp(14px, 1.3vw, 17px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>올라영 학생들이 올킬보카로<br />수능 단어를 마스터하고 있어요</p>
        </div>
        <div className="allkill-stats-nums" style={{ display: 'flex', gap: 16 }}>
          {statsItems.map((stat) => (
            <div key={stat.label} className="allkill-stat-item" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 40px', backdropFilter: 'blur(8px)', minWidth: 160, transition: 'transform 0.2s, background 0.2s' }}>
              <div className="allkill-montserrat allkill-stat-num" style={{ fontSize: 48, fontWeight: 900, color: '#4DD9C0', lineHeight: 1, marginBottom: 10, textShadow: '0 0 30px rgba(77,217,192,0.4)', whiteSpace: 'nowrap' }}>{stat.num}</div>
              <div className="allkill-stat-label" style={{ color: 'rgba(255,255,255,0.65)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
