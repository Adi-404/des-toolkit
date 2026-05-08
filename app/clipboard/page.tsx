import type { Metadata } from 'next';
import ClipboardEditor from '@/components/ClipboardEditor';

export const metadata: Metadata = {
    title: 'des/toolkit — Clipboard',
    description: 'Paste and inspect text or code with line numbers and character counts.',
};

export default function ClipboardPage() {
    return <ClipboardEditor />;
}
