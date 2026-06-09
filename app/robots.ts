import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nexcade.co.za';
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/platform/', '/dashboard/', '/register/'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
