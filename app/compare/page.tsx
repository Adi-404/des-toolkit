import type { Metadata } from 'next';
import PasteCompare from '@/components/PasteCompare';

export const metadata: Metadata = {
    title: 'Paste & compare',
    description: 'Render two HTML/CSS snippets side-by-side in sandboxed iframes.',
};

export default function PasteComparePage() {
    return <PasteCompare />;
}
