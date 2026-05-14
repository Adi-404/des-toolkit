import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-url';

/**
 * Public, indexable surfaces. Authenticated routes (settings, user data) and
 * the auth-flow catch-alls (sign-in, sign-up) are intentionally omitted.
 */
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/',                   priority: 1.0, changeFrequency: 'weekly'  },
    { path: '/moodboard',          priority: 0.9, changeFrequency: 'weekly'  },
    { path: '/fonts',              priority: 0.9, changeFrequency: 'weekly'  },
    { path: '/color/contrast',     priority: 0.7, changeFrequency: 'monthly' },
    { path: '/color/palette',      priority: 0.7, changeFrequency: 'monthly' },
    { path: '/css/bezier',         priority: 0.7, changeFrequency: 'monthly' },
    { path: '/assets/tokens',      priority: 0.7, changeFrequency: 'monthly' },
    { path: '/assets/svg',         priority: 0.7, changeFrequency: 'monthly' },
    { path: '/assets/image',       priority: 0.7, changeFrequency: 'monthly' },
    { path: '/diff',               priority: 0.7, changeFrequency: 'monthly' },
    { path: '/json-formatter',     priority: 0.7, changeFrequency: 'monthly' },
    { path: '/markdown-preview',   priority: 0.7, changeFrequency: 'monthly' },
    { path: '/csv-viewer',         priority: 0.7, changeFrequency: 'monthly' },
    { path: '/jwt-decoder',        priority: 0.7, changeFrequency: 'monthly' },
    { path: '/compare',            priority: 0.6, changeFrequency: 'monthly' },
    { path: '/download',           priority: 0.5, changeFrequency: 'monthly' },
    { path: '/pomodoro',           priority: 0.5, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();
    return ROUTES.map(({ path, priority, changeFrequency }) => ({
        url: `${SITE_URL}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }));
}
