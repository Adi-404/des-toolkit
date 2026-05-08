import type { Metadata } from 'next';
import Gradient from '@/components/Gradient';

export const metadata: Metadata = {
    title: 'des/toolkit — Gradient',
    description: 'Build linear, radial, and conic gradients with copyable CSS.',
};

export default function GradientPage() {
    return <Gradient />;
}
