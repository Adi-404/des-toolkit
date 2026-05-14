import type { Metadata } from 'next';
import Moodboard from '@/components/Moodboard';

export const metadata: Metadata = {
    title: 'Moodboard',
    description:
        'Save design inspiration links and images on a personal bento-style moodboard. Tag with iOS-style colours, ' +
        'refresh previews, organise references from Pinterest, Dribbble, Behance, Canva and Figma — all in one warm tab.',
    alternates: { canonical: '/moodboard' },
    keywords: ['moodboard', 'design inspiration', 'pinterest alternative', 'bento grid', 'design references', 'tags'],
    openGraph: {
        title: 'Moodboard — des/toolkit',
        description: 'A personal bento moodboard for design references. Save, tag, and arrange.',
        url: '/moodboard',
        type: 'website',
    },
};

export default function MoodboardPage() {
    return <Moodboard />;
}
