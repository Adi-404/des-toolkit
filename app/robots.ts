import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                // Authenticated, user-scoped surfaces shouldn't be indexed —
                // their content is private and varies per user.
                disallow: [
                    '/settings',
                    '/sign-in',
                    '/sign-up',
                    '/api/',
                ],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
