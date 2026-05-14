import type { Metadata } from 'next';
import SvgViewer from '@/components/SvgViewer';

export const metadata: Metadata = {
    title: 'SVG viewer',
    description: 'Preview, inspect, and lightly clean up SVG markup.',
};

export default function SvgViewerPage() {
    return <SvgViewer />;
}
