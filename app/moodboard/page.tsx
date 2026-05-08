import type { Metadata } from 'next';
import MoodboardIndex from '@/components/MoodboardIndex';

export const metadata: Metadata = {
    title: 'des/toolkit — Moodboard',
    description: 'Save and arrange design inspiration from Pinterest, Dribbble, Canva and more.',
};

export default function MoodboardIndexPage() {
    return <MoodboardIndex />;
}
