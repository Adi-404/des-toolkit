import type { Metadata } from 'next';
import SpacingScale from '@/components/SpacingScale';

export const metadata: Metadata = {
    title: 'des/toolkit — Spacing',
    description: 'Build spacing scales and preview them across the standard breakpoints.',
};

export default function SpacingPage() {
    return <SpacingScale />;
}
