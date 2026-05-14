import type { Metadata } from 'next';
import TokenTranslator from '@/components/TokenTranslator';

export const metadata: Metadata = {
    title: 'Token translator',
    description: 'Translate colour tokens between CSS variables, Tailwind config, and W3C tokens.json.',
};

export default function TokenTranslatorPage() {
    return <TokenTranslator />;
}
