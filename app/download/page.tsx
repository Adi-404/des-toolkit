import type { Metadata } from 'next';
import ClipboardDownloader from '@/components/ClipboardDownloader';

export const metadata: Metadata = {
    title: 'Download',
    description: 'Instantly download your clipboard content — images or text — with one keystroke.',
};

export default function DownloadPage() {
    return <ClipboardDownloader />;
}
