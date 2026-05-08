import type { Metadata } from 'next';
import Moodboard from '@/components/Moodboard';

export const metadata: Metadata = {
    title: 'des/toolkit — Moodboard',
    description: 'Save and tag design inspiration links — bento-style layout with iOS-style colour tags.',
};

export default function MoodboardPage() {
    return <Moodboard />;
}
