import type { Metadata } from 'next';
import GeminiImage from '@/components/GeminiImage';

export const metadata: Metadata = {
    title: 'des/toolkit — Gemini imagery',
    description: 'Generate placeholder art with Google Imagen via the Gemini API.',
};

export default function GeminiPage() {
    return <GeminiImage />;
}
