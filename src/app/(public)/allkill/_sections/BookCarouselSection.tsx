/* eslint-disable @next/next/no-img-element -- Supabase Storage 외부 URL, 무한 마퀴에는 원본 img가 단순 */
interface BookCard {
  id: string;
  title: string;
  cover_image_url: string;
}

/**
 * 보유 교재 로테이션 카드 — 표지가 등록된 교재만 무한 흘러가기.
 * 가격은 붙이지 않는다(구독 모델: 결제 하나로 전체 교재 이용).
 * PricingSection 바로 위에 배치해 "이 교재 전부 → 이 가격" 흐름을 만든다.
 */
export default function BookCarouselSection({ books }: { books: BookCard[] }) {
  if (books.length === 0) return null;

  // 무한 루프: 트랙을 2번 이어붙이고 -50%까지 이동
  const track = [...books, ...books];
  const duration = Math.max(20, books.length * 5); // 교재 수에 비례한 속도

  return (
    <section className="allkill-section" style={{ background: 'white', padding: '96px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(77,217,192,0.12)', color: '#0D9488', fontSize: 16, fontWeight: 700, padding: '8px 20px', borderRadius: 100, marginBottom: 16 }}>
          보유 교재
        </div>
        <h2 className="allkill-section-title" style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, color: '#0F172A', lineHeight: 1.3, marginBottom: 14 }}>
          구독 하나로,<br /><span style={{ color: '#7C3AED' }}>이 교재 전부</span> 이용해요
        </h2>
        <p style={{ fontSize: 'clamp(15px, 1.4vw, 18px)', color: '#64748B', lineHeight: 1.8, marginBottom: 48, wordBreak: 'keep-all' }}>
          교재별로 따로 결제하지 않아요. 아래 결제 하나면 모든 교재가 열립니다.
        </p>
      </div>

      {/* 마퀴 트랙 */}
      <div className="allkill-book-marquee" style={{ position: 'relative' }}>
        {/* 좌우 페이드 */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 80, background: 'linear-gradient(to right, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 80, background: 'linear-gradient(to left, white, transparent)', zIndex: 2, pointerEvents: 'none' }} />

        <div
          className="allkill-book-track"
          style={{ display: 'flex', gap: 28, width: 'max-content', animation: `allkill-book-scroll ${duration}s linear infinite` }}
        >
          {track.map((book, i) => (
            <div
              key={`${book.id}-${i}`}
              style={{
                width: 190,
                flexShrink: 0,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
                border: '1px solid rgba(15,23,42,0.06)',
                background: 'white',
              }}
            >
              <img
                src={book.cover_image_url}
                alt={book.title}
                loading="lazy"
                style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#334155', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {book.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
