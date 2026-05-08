import type { Metadata } from 'next';
import Palette from '@/components/Palette';

export const metadata: Metadata = {
    title: 'des/toolkit — Palette',
    description: 'Generate ramps and colour harmonies from any base colour.',
};

export default function PalettePage() {
    return <Palette />;
}
