import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
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
        default: 'des/toolkit — Warm workshop for designers + frontend devs',
        // `%s` is the per-page title; pages set `title: 'JSON formatter'` and
        // the suffix is appended automatically.
        template: '%s · des/toolkit',
    },
    description:
        'A browser-based workshop of design tools and a personal moodboard. ' +
        'Save inspiration, build a font library, and reach for quick utilities — ' +
        'contrast checking, JSON formatting, diffs, easing curves, and more — without leaving the tab.',
    applicationName: 'des/toolkit',
    keywords: [
        'moodboard', 'design tools', 'frontend tools', 'developer tools',
        'font book', 'color contrast', 'json formatter', 'diff checker',
        'bezier editor', 'markdown preview', 'jwt decoder', 'csv viewer',
        'design system', 'design tokens', 'palette extractor',
    ],
    authors: [{ name: 'Adi-404', url: 'https://github.com/Adi-404' }],
    creator: 'Adi-404',
    publisher: 'des/toolkit',
    icons: { icon: '/favicon.ico' },
    openGraph: {
        type: 'website',
        url: SITE_URL,
        siteName: 'des/toolkit',
        title: 'des/toolkit — Warm workshop for designers + frontend devs',
        description:
            'Save inspiration, build a font library, and use quick utilities — contrast, JSON, diffs, easing curves — all in one warm tab.',
        locale: 'en_US',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'des/toolkit',
        description:
            'Save inspiration, build a font library, reach for quick frontend tools — all in one warm tab.',
        creator: '@Adi-404',
    },
    robots: { index: true, follow: true },
    category: 'productivity',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const shell = (
        <html lang="en" className={inter.variable}>
            <body>
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
