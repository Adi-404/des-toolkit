import type { Metadata } from 'next';
import Home from '@/components/Home';

export const metadata: Metadata = {
    // Skip the template — the home page wants the full marketing title.
    title: {
        absolute: 'des/toolkit — Warm workshop for designers + frontend devs',
    },
    description:
        'A browser-based workshop: save inspiration on a moodboard, build a personal type library, and reach for small dev utilities — contrast, JSON, diff, easing curves — all in one warm tab.',
    alternates: { canonical: '/' },
    openGraph: {
        title: 'des/toolkit — Warm workshop for designers + frontend devs',
        description:
            'Save inspiration, build a font library, and reach for quick frontend utilities — all in one warm tab.',
        url: '/',
        type: 'website',
    },
};

export default function HomePage() {
    return <Home />;
}
