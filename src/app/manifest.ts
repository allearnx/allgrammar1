import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '올라영 - AI 영어 학습',
    short_name: '올라영',
    description: '중고등 영어 내신·어휘·문법 AI 맞춤 학습',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1e1b4b',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
