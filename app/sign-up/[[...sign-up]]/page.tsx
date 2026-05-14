import type { Metadata } from 'next';
import { SignUp } from '@clerk/nextjs';
import MoodboardMarquee from '@/components/MoodboardMarquee';

export const metadata: Metadata = {
    title: 'Sign up',
    description: 'Create an account to save and tag your inspiration.',
};

export default function SignUpPage() {
    return (
        <div style={{
            flex: 1,
            display: 'flex',
            minHeight: 0,
            background: 'var(--clay-canvas)',
            overflow: 'hidden',
        }}>
            {/* Marquee owns the entire left side, edge-to-edge. */}
            <div style={{
                flex: '1 1 0',
                position: 'relative',
                minWidth: 0,
                overflow: 'hidden',
            }}>
                <MoodboardMarquee />
            </div>

            {/* Sign-up form on the right, capped width with breathing room. */}
            <div style={{
                flex: '0 0 460px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
                borderLeft: '1px solid var(--clay-hairline)',
                overflowY: 'auto',
            }}>
                <SignUp appearance={{
                    variables: { colorPrimary: '#0a0a0a', colorBackground: '#fffaf0' },
                    elements: { rootBox: { width: '100%', maxWidth: 380 } },
                }} />
            </div>
        </div>
    );
}
