import type { Metadata } from 'next';
import Radius from '@/components/Radius';

export const metadata: Metadata = {
    title: 'des/toolkit — Radius',
    description: 'Tune CSS border-radius for any corner, including elliptical (squircle) shapes.',
};

export default function RadiusPage() {
    return <Radius />;
}
