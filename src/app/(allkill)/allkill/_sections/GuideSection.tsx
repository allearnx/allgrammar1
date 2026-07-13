export default function GuideSection() {
  return (
    <section style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%)', padding: 'clamp(60px, 8vw, 100px) 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -150, right: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, left: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(77,217,192,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 36, padding: 'clamp(36px, 5vw, 56px) clamp(24px, 5vw, 64px)', backdropFilter: 'blur(12px)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ background: '#A78BFA', color: 'white', fontSize: 13, fontWeight: 900, padding: '6px 14px', borderRadius: 100, letterSpacing: '0.3px' }}>올라영 ×</span>
            <span className="allkill-montserrat" style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>올킬보카</span>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 100 }}>이용 가이드</span>
        </div>

        <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 900, color: 'white', lineHeight: 1.25, marginBottom: 8 }}>
          처음 시작하는 분들을 위한<br /><span style={{ color: '#4DD9C0' }}>올킬보카 이용 방법</span>
        </h2>
        <p style={{ fontSize: 'clamp(14px, 1.5vw, 16px)', color: 'rgba(255,255,255,0.5)', marginBottom: 36, lineHeight: 1.6 }}>결제 후 아래 순서대로 따라오세요. 어렵지 않아요 🙂</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 'clamp(18px, 2vw, 24px) clamp(20px, 2vw, 28px)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, background: 'rgba(167,139,250,0.25)', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.4)', fontSize: 13, fontWeight: 900, fontFamily: 'Montserrat, sans-serif' }}>01</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#C4B5FD', marginBottom: 6, letterSpacing: '0.5px' }}>STEP 1 · 결제</div>
              <div style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 900, color: 'white', marginBottom: 8, lineHeight: 1.35 }}>올라영 홈페이지에서 결제하기</div>
              <div style={{ fontSize: 'clamp(13px, 1.2vw, 14px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>결제 시 <b style={{ color: 'white' }}>이메일 주소</b>와 <b style={{ color: 'white' }}>전화번호</b>를 입력해 주세요.<br />이 정보가 올킬보카 로그인 아이디와 비밀번호가 됩니다.</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 'clamp(18px, 2vw, 24px) clamp(20px, 2vw, 28px)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, background: 'rgba(77,217,192,0.2)', color: '#4DD9C0', border: '1px solid rgba(77,217,192,0.35)', fontSize: 13, fontWeight: 900, fontFamily: 'Montserrat, sans-serif' }}>02</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4DD9C0', marginBottom: 6, letterSpacing: '0.5px' }}>STEP 2 · 로그인 정보 확인</div>
              <div style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 900, color: 'white', marginBottom: 12, lineHeight: 1.35 }}>아이디 · 비밀번호 확인</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 16px', flex: '1 1 160px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4, letterSpacing: '0.5px' }}>아이디 (ID)</div>
                  <div style={{ fontSize: 14, color: 'white', fontWeight: 700 }}>결제 시 입력한 <span style={{ color: '#4DD9C0' }}>이메일 주소</span></div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 16px', flex: '1 1 160px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: 4, letterSpacing: '0.5px' }}>비밀번호 (PW)</div>
                  <div style={{ fontSize: 14, color: 'white', fontWeight: 700 }}>전화번호 <span style={{ color: '#4DD9C0' }}>숫자만</span> (하이픈 없이)</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 'clamp(18px, 2vw, 24px) clamp(20px, 2vw, 28px)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, background: 'rgba(254,240,138,0.2)', color: '#FEF08A', border: '1px solid rgba(254,240,138,0.35)', fontSize: 13, fontWeight: 900, fontFamily: 'Montserrat, sans-serif' }}>03</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FEF08A', marginBottom: 6, letterSpacing: '0.5px' }}>STEP 3 · 접속</div>
              <div style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 900, color: 'white', marginBottom: 8, lineHeight: 1.35 }}>올킬보카 학습 플랫폼 접속하기</div>
              <div style={{ fontSize: 'clamp(13px, 1.2vw, 14px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 10 }}>아래 주소로 접속하거나, 올라영 홈페이지에서 &quot;올킬보카 학습하러 가기&quot; 버튼을 클릭하세요.</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(77,217,192,0.1)', border: '1px solid rgba(77,217,192,0.3)', borderRadius: 10, padding: '8px 14px' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4DD9C0', flexShrink: 0 }} />
                <span className="allkill-montserrat" style={{ fontSize: 13, fontWeight: 700, color: '#4DD9C0', letterSpacing: '0.3px' }}>voca.allrounderenglish.co.kr</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: 'clamp(18px, 2vw, 24px) clamp(20px, 2vw, 28px)' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2, background: 'rgba(167,139,250,0.25)', color: '#C4B5FD', border: '1px solid rgba(167,139,250,0.4)', fontSize: 13, fontWeight: 900, fontFamily: 'Montserrat, sans-serif' }}>04</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#C4B5FD', marginBottom: 6, letterSpacing: '0.5px' }}>STEP 4 · 북마크</div>
              <div style={{ fontSize: 'clamp(15px, 1.5vw, 18px)', fontWeight: 900, color: 'white', marginBottom: 8, lineHeight: 1.35 }}>다음부터 편하게 — 북마크 저장 추천!</div>
              <div style={{ fontSize: 'clamp(13px, 1.2vw, 14px)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>접속 후 브라우저 북마크(즐겨찾기)에 저장해두면<br />다음부터 버튼 한 번으로 바로 들어올 수 있어요.</div>
            </div>
          </div>

        </div>

        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>문의: michaela@allrounderenglish.com</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}><span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>allrounderenglish.co.kr</span></span>
        </div>

      </div>
    </section>
  );
}
