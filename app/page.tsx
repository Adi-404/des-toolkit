import type { Metadata } from 'next';
import Home from '@/components/Home';

export const metadata: Metadata = {
    title: 'des/toolkit — Workshop',
    description: 'A warm, browser-based workshop of tools for front-end engineers and designers.',
};

export default function HomePage() {
    return <Home />;
}
