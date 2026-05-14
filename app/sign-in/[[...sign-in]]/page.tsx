import type { Metadata } from 'next';
import { SignIn } from '@clerk/nextjs';
import MoodboardDemo from '@/components/MoodboardDemo';

export const metadata: Metadata = {
    title: 'Sign in',
    description: 'Sign in to save and tag your inspiration.',
};

export default function SignInPage() {
    return (
        <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(360px, 1fr) minmax(0, 1.1fr)',
            gap: 'var(--clay-space-xl)',
            padding: 'var(--clay-space-xl)',
            background: 'var(--clay-canvas)',
            overflowY: 'auto',
            minHeight: 0,
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 16px',
            }}>
                <SignIn appearance={{
                    variables: { colorPrimary: '#0a0a0a', colorBackground: '#fffaf0' },
                    elements: { rootBox: { width: '100%', maxWidth: 420 } },
                }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                <div style={{ width: '100%', maxWidth: 560 }}>
                    <MoodboardDemo />
                </div>
            </div>
        </div>
    );
}
