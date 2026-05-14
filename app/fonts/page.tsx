import type { Metadata } from 'next';
import FontBook from '@/components/FontBook';

export const metadata: Metadata = {
    title: 'Fontbook',
    description:
        'Your personal type library. Browse 65+ curated Google Fonts, paste foundry URLs, or upload your own ' +
        '.woff2, .woff, .ttf and .otf files. Every card renders the family live.',
    alternates: { canonical: '/fonts' },
    keywords: ['font library', 'google fonts browser', 'font manager', 'type collection', 'woff2 upload', 'foundry'],
    openGraph: {
        title: 'Fontbook — des/toolkit',
        description: 'Browse, paste, upload — every font card renders live.',
        url: '/fonts',
        type: 'website',
    },
};

export default function FontsPage() {
    return <FontBook />;
}
