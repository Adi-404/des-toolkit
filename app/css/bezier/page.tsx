import type { Metadata } from 'next';
import Bezier from '@/components/Bezier';

export const metadata: Metadata = {
    title: 'des/toolkit — Bezier',
    description: 'Design CSS cubic-bezier easing curves with a live motion preview.',
};

export default function BezierPage() {
    return <Bezier />;
}
