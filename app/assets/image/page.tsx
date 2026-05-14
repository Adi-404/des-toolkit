import type { Metadata } from 'next';
import ImageToolkit from '@/components/ImageToolkit';

export const metadata: Metadata = {
    title: 'Image toolkit',
    description: 'Convert images to base64, read dimensions, and generate a favicon set.',
};

export default function ImageToolkitPage() {
    return <ImageToolkit />;
}
