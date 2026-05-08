import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
    return (
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
}
