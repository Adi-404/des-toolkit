import { ImageResponse } from 'next/og';
import { SITE_URL } from '@/lib/site-url';

/**
 * Dynamic OpenGraph card for the home page.
 *
 * Renders at request time using Next.js's ImageResponse / Satori. The two
 * fonts (Inter Bold and Caveat Bold) are pulled directly from Google Fonts
 * via the CSS API — with an older User-Agent so Google serves TTF instead
 * of WOFF2 (Satori does not parse WOFF2). The result mirrors the home-page
 * hero so the unfurl looks like an extension of the site, not generic.
 *
 * If a font fetch fails, the layout still renders — Satori falls back to
 * the default system sans, just without the handwritten accent.
 */

export const runtime = 'edge';

export const alt =
    'des/toolkit — A warmer place to design in. Moodboard, fontbook, and frontend tools in one tab.';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// User-Agent strings that elicit TTF (not WOFF2) from Google Fonts.
const TTF_UA = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36';

async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
    try {
        const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`;
        const css = await fetch(cssUrl, { headers: { 'User-Agent': TTF_UA } }).then((r) => r.text());
        const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)\s*format\('(?:truetype|opentype|woff)'\)/);
        if (!match) return null;
        return await fetch(match[1]).then((r) => r.arrayBuffer());
    } catch {
        return null;
    }
}

export default async function OpenGraphImage() {
    const [inter700, caveat700] = await Promise.all([
        loadGoogleFont('Inter', 700),
        loadGoogleFont('Caveat', 700),
    ]);

    // The visible URL on the OG card derives from the resolved SITE_URL so
    // the image follows the deployment without code edits.
    const displayUrl = (() => {
        try { return new URL(SITE_URL).hostname.replace(/^www\./, ''); }
        catch { return 'des-toolkit'; }
    })();

    // Clay palette inlined — globals.css custom properties aren't available
    // inside Satori, which only sees the JSX tree.
    const C = {
        canvas: '#fffaf0',
        ink: '#0a0a0a',
        body: '#3a3a3a',
        muted: '#6a6a6a',
        hairline: '#e5e5e5',
        pink: '#ff4d8b',
        lavender: '#b8a4ed',
        peach: '#ffb084',
        coral: '#ff6b5a',
        mint: '#a4d4c5',
        ochre: '#e8b94a',
        teal: '#1a3a3a',
        surface: '#f5f0e0',
    };

    // Satori-friendly letter badges. The site's Unicode glyphs (✿ ⧉ ⇄ ◐ ∿)
    // aren't in Inter and would render as tofu in the OG card, so we use
    // short letter codes that map back to the tool names visually.
    const toolBadges: { glyph: string; bg: string; fg: string }[] = [
        { glyph: 'M',  bg: C.pink,     fg: '#fff' },   // Moodboard
        { glyph: 'Aa', bg: C.lavender, fg: C.ink  },   // Fonts
        { glyph: 'Cb', bg: C.peach,    fg: C.ink  },   // Clipboard
        { glyph: 'Df', bg: C.coral,    fg: '#fff' },   // Diff
        { glyph: '{}', bg: C.ochre,    fg: C.ink  },   // JSON
        { glyph: 'Co', bg: C.mint,     fg: C.ink  },   // Contrast
        { glyph: 'Bz', bg: C.teal,     fg: '#fff' },   // Bezier
        { glyph: 'Md', bg: C.surface,  fg: C.ink  },   // Markdown
    ];

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: C.canvas,
                    // Diagonal warm-amber stripes, matching globals.css body bg.
                    backgroundImage:
                        'repeating-linear-gradient(-45deg, rgba(165, 105, 35, 0.06) 0px, rgba(165, 105, 35, 0.06) 3px, transparent 3px, transparent 6px)',
                    padding: '64px 72px',
                    fontFamily: 'Inter, sans-serif',
                    color: C.ink,
                    position: 'relative',
                }}
            >
                {/* Top row: wordmark + alpha stamp */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            fontSize: 38,
                            fontWeight: 700,
                            letterSpacing: '-1px',
                        }}
                    >
                        <span>des</span>
                        <span style={{ color: C.pink, margin: '0 2px' }}>/</span>
                        <span>toolkit</span>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            fontFamily: 'Caveat, cursive',
                            fontSize: 38,
                            color: C.pink,
                            transform: 'rotate(-3deg)',
                            transformOrigin: 'left center',
                        }}
                    >
                        alpha
                    </div>
                </div>

                {/* Hero text */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 980 }}>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'baseline',
                            fontSize: 120,
                            fontWeight: 700,
                            lineHeight: 1,
                            letterSpacing: '-4px',
                            gap: 16,
                        }}
                    >
                        <span>A warmer place to</span>
                        <span
                            style={{
                                display: 'flex',
                                fontFamily: 'Caveat, cursive',
                                color: C.pink,
                                fontSize: 144,
                                lineHeight: 0.9,
                                letterSpacing: 0,
                                transform: 'rotate(-2deg)',
                                transformOrigin: 'center bottom',
                            }}
                        >
                            design
                        </span>
                        <span>in.</span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            fontSize: 30,
                            color: C.body,
                            lineHeight: 1.4,
                            maxWidth: 820,
                        }}
                    >
                        A moodboard, a fontbook, and a small kit of dev utilities — all in one warm tab.
                    </div>
                </div>

                {/* Bottom row: tool badges + URL */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div style={{ display: 'flex', gap: 12 }}>
                        {toolBadges.map((b, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 60,
                                    height: 60,
                                    background: b.bg,
                                    color: b.fg,
                                    borderRadius: 14,
                                    fontSize: b.glyph.length > 1 ? 22 : 30,
                                    fontWeight: 600,
                                    border: `1px solid ${C.hairline}`,
                                }}
                            >
                                {b.glyph}
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            fontFamily: 'Caveat, cursive',
                            fontSize: 34,
                            color: C.muted,
                            transform: 'rotate(-1deg)',
                            transformOrigin: 'right center',
                        }}
                    >
                        {displayUrl}
                    </div>
                </div>

                {/* Gradient stripe at the very bottom — the project's signature flourish */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: 8,
                        display: 'flex',
                        background: `linear-gradient(90deg, ${C.pink}, ${C.lavender}, ${C.peach}, ${C.coral}, ${C.mint}, ${C.ochre}, ${C.pink})`,
                    }}
                />
            </div>
        ),
        {
            ...size,
            fonts: [
                ...(inter700  ? [{ name: 'Inter',  data: inter700,  style: 'normal' as const, weight: 700 as const }] : []),
                ...(caveat700 ? [{ name: 'Caveat', data: caveat700, style: 'normal' as const, weight: 700 as const }] : []),
            ],
        },
    );
}
