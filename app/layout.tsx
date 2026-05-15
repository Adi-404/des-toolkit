import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import Topbar from '@/components/Topbar';
import ContextMenu from '@/components/ContextMenu';
import GlobalShortcuts from '@/components/GlobalShortcuts';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { SITE_URL } from '@/lib/site-url';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
    variable: '--clay-font-inter',
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        // The string "des toolkit" (no slash) is included verbatim so Google
        // tokenizes the brand as a single entity rather than two unrelated
        // tokens around the `/`.
        default: 'des/toolkit (des toolkit) — Warm workshop for designers + frontend devs',
        // `%s` is the per-page title; pages set `title: 'JSON formatter'` and
        // the suffix is appended automatically.
        template: '%s · des/toolkit',
    },
    description:
        'des toolkit — a browser-based workshop of design tools and a personal moodboard. ' +
        'Save inspiration, build a font library, and reach for quick utilities — ' +
        'contrast checking, JSON formatting, diffs, easing curves, and more — without leaving the tab.',
    applicationName: 'des toolkit',
    keywords: [
        // Brand variants — Google tokenizes the slashed and spaced forms
        // differently, so list every shape someone might type.
        'des toolkit', 'des/toolkit', 'destoolkit', 'destoolkit.com',
        // Surfaces
        'moodboard', 'fontbook', 'design tools', 'frontend tools', 'developer tools',
        'design system tools', 'design utilities',
        // Tools-by-name
        'color contrast checker', 'json formatter', 'diff checker',
        'cubic bezier editor', 'markdown preview', 'jwt decoder', 'csv viewer',
        'palette extractor', 'token translator', 'svg viewer',
        // Use-cases
        'design tokens', 'wcag contrast', 'easing curves', 'css tools',
        'design inspiration', 'type collection', 'paste and compare',
    ],
    authors: [{ name: 'Adi-404', url: 'https://github.com/Adi-404' }],
    creator: 'Adi-404',
    publisher: 'des/toolkit',
    icons: { icon: '/favicon.ico' },
    manifest: '/manifest.webmanifest',
    openGraph: {
        type: 'website',
        url: SITE_URL,
        siteName: 'des toolkit',
        title: 'des toolkit — Warm workshop for designers + frontend devs',
        description:
            'Save inspiration, build a font library, and use quick utilities — contrast, JSON, diffs, easing curves — all in one warm tab.',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'des toolkit',
        description:
            'Save inspiration, build a font library, reach for quick frontend tools — all in one warm tab.',
        creator: '@Adi-404',
    },
    robots: { index: true, follow: true },
    category: 'productivity',
    verification: {
        // Drop the value Google Search Console gives you here. Until then,
        // the meta tag just won't be emitted. Vercel env var alternative:
        // set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION and we'll plumb it.
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
};

/**
 * Structured-data graph for the home/site — restores the JSON-LD that
 * earlier got removed. The biggest wins here for "des toolkit" search
 * recognition are:
 *   - `alternateName` reinforces both the slashed and the spaced form so
 *     Google indexes them as synonyms of the same entity.
 *   - `sameAs` links to off-site profiles (GitHub, LinkedIn) — these are
 *     the canonical signal for "this brand is real" in Google's Knowledge
 *     Graph.
 *   - WebSite + SearchAction tells Google the site has an internal search,
 *     which can earn the search-box rich result.
 */
const STRUCTURED_DATA = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: SITE_URL,
            name: 'des/toolkit',
            alternateName: ['des toolkit', 'destoolkit', 'destoolkit.com'],
            description:
                'A warm browser-based workshop for designers and frontend developers — moodboard, fontbook, and small dev utilities in one place.',
            inLanguage: 'en-US',
            potentialAction: {
                '@type': 'SearchAction',
                target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
                'query-input': 'required name=search_term_string',
            },
        },
        {
            '@type': 'Organization',
            '@id': `${SITE_URL}/#org`,
            name: 'des/toolkit',
            alternateName: ['des toolkit', 'destoolkit', 'destoolkit.com'],
            url: SITE_URL,
            logo: `${SITE_URL}/opengraph-image`,
            founder: { '@type': 'Person', name: 'Adi-404', url: 'https://github.com/Adi-404' },
            // sameAs is Google Knowledge Graph's canonical "this brand is
            // real" signal. The custom-domain home page belongs here too so
            // the entity gets clearly tied to the new URL after the move
            // from the *.vercel.app preview origin.
            sameAs: [
                'https://www.destoolkit.com',
                'https://github.com/Adi-404/des-toolkit',
                'https://github.com/Adi-404',
                'https://www.linkedin.com/in/adityanmahapatra/',
            ],
        },
        {
            '@type': 'SoftwareApplication',
            '@id': `${SITE_URL}/#app`,
            name: 'des toolkit',
            alternateName: 'des/toolkit',
            applicationCategory: 'DesignApplication',
            operatingSystem: 'Web',
            url: SITE_URL,
            description:
                'Moodboard for design inspiration, fontbook for type collection, and a kit of frontend tools — contrast, JSON, diff, bezier easing, CSV, JWT, markdown, palette extractor.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            screenshot: `${SITE_URL}/opengraph-image`,
        },
    ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const shell = (
        <html lang="en" className={inter.variable}>
            <body>
                <script
                    type="application/ld+json"
                    // JSON.stringify on a constant — safe to inject directly.
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
                />
                <SettingsProvider>
                    <ContextMenu />
                    <GlobalShortcuts />
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                        <Topbar />
                        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                            {children}
                        </main>
                    </div>
                </SettingsProvider>
                <Analytics />
            </body>
        </html>
    );

    // ClerkProvider needs the publishable key at render time. When it's not
    // configured (e.g. CI build without secrets, fresh checkout), we let the
    // app render in a no-auth state; persistence routes will fail at the
    // action layer rather than the entire build going red.
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        return shell;
    }

    return (
        <ClerkProvider
            appearance={{
                variables: {
                    colorPrimary: '#0a0a0a',
                    colorBackground: '#fffaf0',
                    colorText: '#0a0a0a',
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
                    borderRadius: '12px',
                },
            }}
        >
            {shell}
        </ClerkProvider>
    );
}
