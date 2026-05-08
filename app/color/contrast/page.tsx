import type { Metadata } from 'next';
import Contrast from '@/components/Contrast';

export const metadata: Metadata = {
    title: 'des/toolkit — Contrast',
    description: 'Check WCAG contrast ratios and preview colour-blindness scenarios.',
};

export default function ContrastPage() {
    return <Contrast />;
}
