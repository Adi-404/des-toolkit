import type { Metadata } from 'next';
import TypeScale from '@/components/TypeScale';

export const metadata: Metadata = {
    title: 'des/toolkit — Type scale',
    description: 'Generate a modular type ramp from a base size and a ratio.',
};

export default function TypeScalePage() {
    return <TypeScale />;
}
