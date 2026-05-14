import type { Metadata } from 'next';
import Contrast from '@/components/Contrast';

export const metadata: Metadata = {
    title: 'Contrast checker',
    description:
        'Check WCAG 2.1 colour contrast ratios for foreground/background pairs and preview how the pair lands ' +
        'under different forms of colour-vision deficiency. AA and AAA grades shown for body and large text.',
    alternates: { canonical: '/color/contrast' },
    keywords: ['wcag', 'contrast checker', 'accessibility', 'color contrast', 'a11y', 'color blindness preview'],
    openGraph: {
        title: 'Contrast checker — des/toolkit',
        description: 'WCAG ratios + colour-blindness preview for any colour pair.',
        url: '/color/contrast',
        type: 'website',
    },
};

export default function ContrastPage() {
    return <Contrast />;
}
