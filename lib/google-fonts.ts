// Curated catalog of Google Fonts shown in the fontbook picker. Not every
// Google font — a designer-friendly subset across categories. Adding a new
// entry is one line; the picker handles the rest (preview, search, save).

export type FontCategory = 'sans' | 'serif' | 'display' | 'mono' | 'handwriting';

export interface CatalogFont {
    family: string;
    category: FontCategory;
}

export const FONT_CATEGORIES: { id: FontCategory | 'all'; label: string }[] = [
    { id: 'all',         label: 'All' },
    { id: 'sans',        label: 'Sans' },
    { id: 'serif',       label: 'Serif' },
    { id: 'display',     label: 'Display' },
    { id: 'mono',        label: 'Mono' },
    { id: 'handwriting', label: 'Handwriting' },
];

export const GOOGLE_FONTS: CatalogFont[] = [
    // ── Sans ──
    { family: 'Inter',                category: 'sans' },
    { family: 'Roboto',               category: 'sans' },
    { family: 'Open Sans',            category: 'sans' },
    { family: 'Manrope',              category: 'sans' },
    { family: 'DM Sans',              category: 'sans' },
    { family: 'Plus Jakarta Sans',    category: 'sans' },
    { family: 'Outfit',               category: 'sans' },
    { family: 'Work Sans',            category: 'sans' },
    { family: 'Geist',                category: 'sans' },
    { family: 'Space Grotesk',        category: 'sans' },
    { family: 'Lexend',               category: 'sans' },
    { family: 'Onest',                category: 'sans' },
    { family: 'Sora',                 category: 'sans' },
    { family: 'Public Sans',          category: 'sans' },
    { family: 'Be Vietnam Pro',       category: 'sans' },
    { family: 'Mulish',               category: 'sans' },
    { family: 'Nunito',               category: 'sans' },
    { family: 'Karla',                category: 'sans' },
    { family: 'Hanken Grotesk',       category: 'sans' },
    { family: 'Albert Sans',          category: 'sans' },
    { family: 'Figtree',              category: 'sans' },
    { family: 'Geologica',            category: 'sans' },
    { family: 'Wix Madefor Display',  category: 'sans' },

    // ── Serif ──
    { family: 'Playfair Display',     category: 'serif' },
    { family: 'Fraunces',             category: 'serif' },
    { family: 'Source Serif 4',       category: 'serif' },
    { family: 'Lora',                 category: 'serif' },
    { family: 'EB Garamond',          category: 'serif' },
    { family: 'Crimson Pro',          category: 'serif' },
    { family: 'Cormorant',            category: 'serif' },
    { family: 'Libre Baskerville',    category: 'serif' },
    { family: 'Merriweather',         category: 'serif' },
    { family: 'PT Serif',             category: 'serif' },
    { family: 'Spectral',             category: 'serif' },
    { family: 'Newsreader',           category: 'serif' },
    { family: 'Cardo',                category: 'serif' },

    // ── Display ──
    { family: 'Bricolage Grotesque',  category: 'display' },
    { family: 'Unbounded',            category: 'display' },
    { family: 'Instrument Serif',     category: 'display' },
    { family: 'Caprasimo',            category: 'display' },
    { family: 'Anton',                category: 'display' },
    { family: 'Bebas Neue',           category: 'display' },
    { family: 'Lobster',              category: 'display' },
    { family: 'Pacifico',             category: 'display' },
    { family: 'Righteous',            category: 'display' },
    { family: 'Playball',             category: 'display' },
    { family: 'Big Shoulders Display', category: 'display' },
    { family: 'Major Mono Display',   category: 'display' },
    { family: 'Syne',                 category: 'display' },
    { family: 'Yeseva One',           category: 'display' },
    { family: 'Permanent Marker',     category: 'display' },

    // ── Monospace ──
    { family: 'JetBrains Mono',       category: 'mono' },
    { family: 'Fira Code',            category: 'mono' },
    { family: 'IBM Plex Mono',        category: 'mono' },
    { family: 'Geist Mono',           category: 'mono' },
    { family: 'Source Code Pro',      category: 'mono' },
    { family: 'Roboto Mono',          category: 'mono' },
    { family: 'Inconsolata',          category: 'mono' },
    { family: 'Space Mono',           category: 'mono' },

    // ── Handwriting ──
    { family: 'Caveat',               category: 'handwriting' },
    { family: 'Dancing Script',       category: 'handwriting' },
    { family: 'Patrick Hand',         category: 'handwriting' },
    { family: 'Kalam',                category: 'handwriting' },
    { family: 'Indie Flower',         category: 'handwriting' },
    { family: 'Sacramento',           category: 'handwriting' },
    { family: 'Shadows Into Light',   category: 'handwriting' },
];

export function googleSpecimenUrl(family: string): string {
    return `https://fonts.google.com/specimen/${encodeURIComponent(family).replace(/%20/g, '+')}`;
}

/** Build a single Google Fonts CSS request that loads every family in the
 *  list — used by the picker to render previews in their own faces. */
export function batchedGoogleFontsCss(families: string[]): string {
    if (families.length === 0) return '';
    const params = families
        .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}`)
        .join('&');
    return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
