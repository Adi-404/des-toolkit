import type { Metadata } from 'next';
import ColorPalette from '@/components/ColorPalette';

export const metadata: Metadata = {
    title: 'palette extractor',
    description: 'Drop any image to extract its dominant color palette. Export as hex list, CSS variables, or Tailwind config.',
};

export default function PalettePage() {
    return <ColorPalette />;
}
