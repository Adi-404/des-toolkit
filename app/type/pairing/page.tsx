import type { Metadata } from 'next';
import FontPairing from '@/components/FontPairing';

export const metadata: Metadata = {
    title: 'des/toolkit — Font pairing',
    description: 'Preview Google Fonts heading + body pairs on real editorial copy.',
};

export default function FontPairingPage() {
    return <FontPairing />;
}
