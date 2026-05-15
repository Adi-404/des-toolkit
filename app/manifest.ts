import type { MetadataRoute } from 'next';

/**
 * Web App Manifest — served at /manifest.webmanifest.
 *
 * Two reasons to ship this even without going full PWA:
 *  1. Google's crawler reads the manifest to decide whether a site is an
 *     "installable app", which slightly bumps SoftwareApplication rich
 *     results and entity recognition.
 *  2. LLM crawlers (Perplexity, Claude, ChatGPT search) increasingly
 *     surface the `description` field as the canonical site summary.
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'des/toolkit — Warm workshop for designers + frontend devs',
        short_name: 'des toolkit',
        description:
            'A browser-based workshop: save inspiration on a moodboard, build a personal type library, and reach for small dev utilities — contrast, JSON, diffs, easing curves — all in one warm tab.',
        start_url: '/',
        display: 'standalone',
        background_color: '#fffaf0',
        theme_color: '#0a0a0a',
        categories: ['productivity', 'design', 'developer'],
        icons: [
            { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
            // Dynamic OG image doubles as a maskable icon source — it has the
            // brand wordmark + colour palette baked in. 1200×630 isn't the
            // ideal aspect for an icon, but it's a usable source for the
            // PWA's banner and saves us shipping a separate asset for now.
            { src: '/opengraph-image', sizes: '1200x630', type: 'image/png', purpose: 'any' },
        ],
    };
}
