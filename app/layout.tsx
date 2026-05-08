import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Topbar from '@/components/Topbar';
import ContextMenu from '@/components/ContextMenu';

const inter = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700'],
    display: 'swap',
    variable: '--clay-font-inter',
});

export const metadata: Metadata = {
    title: 'des/toolkit',
    description: 'A warm, browser-based workshop of design + frontend tools and a place to keep your inspiration.',
    icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const shell = (
        <html lang="en" className={inter.variable}>
            <body>
                <ContextMenu />
                <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                    <Topbar />
                    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                        {children}
                    </main>
                </div>
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
