import type { Metadata } from 'next';
import FontBook from '@/components/FontBook';

export const metadata: Metadata = {
    title: 'des/toolkit — fontbook',
    description: 'Your personal type library — search Google Fonts, paste foundry links, or upload your own files.',
};

export default function FontsPage() {
    return <FontBook />;
}
