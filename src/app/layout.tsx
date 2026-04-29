import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Noto_Sans_KR } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSansKr = Noto_Sans_KR({
  variable: '--font-noto-sans-kr',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
});

export const metadata: Metadata = {
  title: '올라영 | 중고등·국제학교 영어 내신·어휘·문법 AI 학습',
  description:
    '중고등·국제학교 영어 완전 정복. 내신·어휘·문법 AI 맞춤 학습 + 25년 경력 원장 직강. 강남 기출 분석 기반으로 1등급 도전하세요.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '올라영',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansKr.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
