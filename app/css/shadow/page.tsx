import type { Metadata } from 'next';
import Shadow from '@/components/Shadow';

export const metadata: Metadata = {
    title: 'des/toolkit — Shadow',
    description: 'Stack and tune CSS box-shadow layers with live preview.',
};

export default function ShadowPage() {
    return <Shadow />;
}
