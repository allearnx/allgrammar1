import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.allrounderenglish.co.kr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/find-email',
          '/callback',
          '/impersonate',
          '/student/',
          '/teacher/',
          '/admin/',
          '/boss/',
          '/api/',
          '/parent/',
          '/billing/',
          '/payment/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
