import type { Metadata } from 'next';
import MoodboardBoard from '@/components/MoodboardBoard';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    await params;
    return {
        title: 'des/toolkit — Moodboard',
        description: 'Saved design references and inspiration links.',
    };
}

export default async function MoodboardBoardPage({ params }: Props) {
    const { id } = await params;
    return <MoodboardBoard boardId={id} />;
}
