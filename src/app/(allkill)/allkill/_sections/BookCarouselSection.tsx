/* eslint-disable @next/next/no-img-element -- Supabase Storage 외부 URL, 무한 마퀴에는 원본 img가 단순 */
import { C, coverageChips } from '../_data';

interface BookCard {
  id: string;
  title: string;
  cover_image_url: string;
}

/**
 * 보유 교재 — 수록 범위 칩 + 표지 마퀴를 한 섹션에 (랜딩에서 수록 단어는 여기 한 번만).
 * 가격은 붙이지 않는다(구독 모델: 결제 하나로 전체 교재 이용).
 */
export default function BookCarouselSection({ books }: { books: BookCard[] }) {
  if (books.length === 0) return null;

  // 무한 루프: 트랙을 2번 이어붙이고 -50%까지 이동
  const track = [...books, ...books];
  const duration = Math.max(20, books.length * 5);

  return (
    <section className="ak-section" style={{ background: 'white', padding: '96px 0', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
        <span className="ak-badge">수록 교재</span>
        <h2 className="ak-h2" style={{ color: C.ink }}>
          구독 하나로, <span style={{ color: C.blue }}>모든 교재</span>
        </h2>
        <p className="ak-sub" style={{ color: C.gray }}>
          교재별 추가 결제 없음 — 중학 교과서부터 수능 기출까지 전부 열려요.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', margin: '32px 0 56px' }}>
          {coverageChips.map((chip) => (
            <span key={chip} style={{ fontSize: 14, fontWeight: 700, color: C.blueDark, background: C.blueLight, padding: '9px 20px', borderRadius: 100, whiteSpace: 'nowrap' }}>
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* 마퀴 트랙 */}
      <div className="allkill-book-marquee" style={{ position: 'relative' }}>
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
                width: 180,
                flexShrink: 0,
                borderRadius: 16,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(31,31,31,0.10)',
                border: `1px solid ${C.line}`,
                background: 'white',
              }}
            >
              <img
                src={book.cover_image_url}
                alt={book.title}
                loading="lazy"
                style={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: C.gray, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {book.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
