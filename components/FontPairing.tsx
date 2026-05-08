'use client';

import { useEffect, useMemo, useState } from 'react';
import shell from './ToolPage.module.css';
import styles from './FontPairing.module.css';

interface Font {
    name: string;
    /** Google Fonts CSS2 query for the family + weights we want. */
    query: string;
    category: 'serif' | 'sans' | 'display' | 'mono';
    fallback: string;
}

const FONTS: Font[] = [
    // Sans-serif
    { name: 'Inter',         query: 'Inter:wght@400;500;600;700',     category: 'sans',    fallback: 'sans-serif' },
    { name: 'Manrope',       query: 'Manrope:wght@400;500;600;700',   category: 'sans',    fallback: 'sans-serif' },
    { name: 'Plus Jakarta Sans', query: 'Plus+Jakarta+Sans:wght@400;500;600;700', category: 'sans', fallback: 'sans-serif' },
    { name: 'DM Sans',       query: 'DM+Sans:wght@400;500;600;700',   category: 'sans',    fallback: 'sans-serif' },
    { name: 'Work Sans',     query: 'Work+Sans:wght@400;500;600;700', category: 'sans',    fallback: 'sans-serif' },
    { name: 'Geist',         query: 'Geist:wght@400;500;600;700',     category: 'sans',    fallback: 'sans-serif' },
    { name: 'Outfit',        query: 'Outfit:wght@400;500;600;700',    category: 'sans',    fallback: 'sans-serif' },
    { name: 'Space Grotesk', query: 'Space+Grotesk:wght@400;500;600;700', category: 'sans', fallback: 'sans-serif' },
    // Serif
    { name: 'Playfair Display', query: 'Playfair+Display:wght@400;500;600;700', category: 'serif', fallback: 'serif' },
    { name: 'Fraunces',      query: 'Fraunces:wght@400;500;600;700',  category: 'serif',   fallback: 'serif' },
    { name: 'Lora',          query: 'Lora:wght@400;500;600;700',      category: 'serif',   fallback: 'serif' },
    { name: 'Source Serif 4', query: 'Source+Serif+4:wght@400;500;600;700', category: 'serif', fallback: 'serif' },
    { name: 'EB Garamond',   query: 'EB+Garamond:wght@400;500;600;700', category: 'serif', fallback: 'serif' },
    { name: 'Crimson Pro',   query: 'Crimson+Pro:wght@400;500;600;700', category: 'serif', fallback: 'serif' },
    // Display
    { name: 'Bricolage Grotesque', query: 'Bricolage+Grotesque:wght@400;500;600;700', category: 'display', fallback: 'sans-serif' },
    { name: 'Instrument Serif', query: 'Instrument+Serif:wght@400', category: 'display', fallback: 'serif' },
    { name: 'Unbounded',     query: 'Unbounded:wght@400;500;600;700', category: 'display', fallback: 'sans-serif' },
    { name: 'Zodiak',        query: 'Inter:wght@400;500;600;700',     category: 'display', fallback: 'serif' }, // fallback (not on Google Fonts)
    // Mono
    { name: 'JetBrains Mono', query: 'JetBrains+Mono:wght@400;500;600', category: 'mono', fallback: 'monospace' },
    { name: 'IBM Plex Mono', query: 'IBM+Plex+Mono:wght@400;500;600', category: 'mono',   fallback: 'monospace' },
    { name: 'Geist Mono',    query: 'Geist+Mono:wght@400;500;600',    category: 'mono',   fallback: 'monospace' },
];

const PRESETS: { name: string; meta: string; head: string; body: string }[] = [
    { name: 'Editorial',    meta: 'Playfair Display + Inter',           head: 'Playfair Display', body: 'Inter' },
    { name: 'Modern brand', meta: 'Bricolage Grotesque + Manrope',      head: 'Bricolage Grotesque', body: 'Manrope' },
    { name: 'Soft & warm',  meta: 'Fraunces + Plus Jakarta Sans',       head: 'Fraunces',         body: 'Plus Jakarta Sans' },
    { name: 'Geometric',    meta: 'Outfit + Inter',                     head: 'Outfit',           body: 'Inter' },
    { name: 'Long-form',    meta: 'Source Serif 4 + Inter',             head: 'Source Serif 4',   body: 'Inter' },
    { name: 'High contrast', meta: 'Unbounded + Work Sans',             head: 'Unbounded',        body: 'Work Sans' },
    { name: 'Tech',         meta: 'Space Grotesk + JetBrains Mono',     head: 'Space Grotesk',    body: 'Inter' },
];

const SAMPLE = {
    kicker:  'Type pairing — preview',
    h1:      'A warmer toolbelt for the front-end craft.',
    h2:      'Designed for the moments between commits.',
    lead:    'Clipboard, diffs, JSON, colour, type and the rest — in one calm, opinionated workspace built for engineers and designers who care about the details.',
    body:    'Body copy at 16px / 1.65. The quick brown fox jumps over the lazy dog: 1234567890 (& *).',
    quote:   '“Make typography decisions you can defend on a small screen and a long page. Everything else follows.”',
    mono:    'function pair(headline, body) {\n  return { headline, body };\n}',
};

function buildLinkHref(headFont: Font, bodyFont: Font): string {
    if (headFont.name === bodyFont.name) {
        return `https://fonts.googleapis.com/css2?family=${headFont.query}&display=swap`;
    }
    return `https://fonts.googleapis.com/css2?family=${headFont.query}&family=${bodyFont.query}&display=swap`;
}

export default function FontPairing() {
    const [head, setHead] = useState('Playfair Display');
    const [body, setBody] = useState('Inter');

    const headFont = useMemo(() => FONTS.find((f) => f.name === head) ?? FONTS[0], [head]);
    const bodyFont = useMemo(() => FONTS.find((f) => f.name === body) ?? FONTS[0], [body]);

    // Inject a <link> tag for whichever pair is selected. Tag is replaced on each change.
    useEffect(() => {
        const linkId = 'dt-font-pairing';
        const href = buildLinkHref(headFont, bodyFont);
        let link = document.getElementById(linkId) as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement('link');
            link.id = linkId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        link.href = href;
        return () => {
            // Keep the link around between component remounts so the fonts stay
            // cached; only remove on unmount of the page itself.
        };
    }, [headFont, bodyFont]);

    function swap() {
        setHead(body);
        setBody(head);
    }

    function applyPreset(p: typeof PRESETS[number]) {
        setHead(p.head);
        setBody(p.body);
    }

    const headStack = `'${headFont.name}', ${headFont.fallback}`;
    const bodyStack = `'${bodyFont.name}', ${bodyFont.fallback}`;

    const exportCss = useMemo(
        () => `@import url('${buildLinkHref(headFont, bodyFont)}');\n\n:root {\n  --font-display: ${headStack};\n  --font-body:    ${bodyStack};\n}`,
        [headFont, bodyFont, headStack, bodyStack],
    );

    const [copied, setCopied] = useState(false);
    async function copyCss() {
        await navigator.clipboard.writeText(exportCss);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Type · pairing</div>
                        <h1 className={shell.title}>Font pairing.</h1>
                        <p className={shell.lede}>
                            Preview a heading + body Google Fonts pair on real editorial copy.
                            Pick from presets or browse the full list, then copy the import + CSS.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnPrimary} onClick={copyCss}>
                            {copied ? '✓ Copied' : '⧉ Copy import + CSS'}
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={shell.card}>
                        <div className={styles.controls}>
                            <div className={styles.field}>
                                <span className={shell.label}>Heading</span>
                                <select
                                    className={styles.select}
                                    value={head}
                                    onChange={(e) => setHead(e.target.value)}
                                >
                                    {FONTS.map((f) => (
                                        <option key={f.name} value={f.name}>
                                            {f.name} — {f.category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button className={styles.swap} onClick={swap} aria-label="Swap heading and body">⇅</button>

                            <div className={styles.field}>
                                <span className={shell.label}>Body</span>
                                <select
                                    className={styles.select}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                >
                                    {FONTS.map((f) => (
                                        <option key={f.name} value={f.name}>
                                            {f.name} — {f.category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.field}>
                                <span className={shell.label}>Presets</span>
                                <div className={styles.presetGrid}>
                                    {PRESETS.map((p) => (
                                        <button key={p.name} type="button" className={styles.presetBtn} onClick={() => applyPreset(p)}>
                                            <span className={styles.presetName}>{p.name}</span>
                                            <span className={styles.presetMeta}>{p.meta}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.preview}>
                        <span className={styles.previewLabel}>Preview · {headFont.name} + {bodyFont.name}</span>
                        <span className={styles.previewKicker} style={{ fontFamily: bodyStack }}>{SAMPLE.kicker}</span>
                        <h2 className={styles.previewH1} style={{ fontFamily: headStack }}>{SAMPLE.h1}</h2>
                        <p className={styles.previewLead} style={{ fontFamily: bodyStack }}>{SAMPLE.lead}</p>
                        <h3 className={styles.previewH2} style={{ fontFamily: headStack }}>{SAMPLE.h2}</h3>
                        <p className={styles.previewBody} style={{ fontFamily: bodyStack }}>{SAMPLE.body}</p>
                        <blockquote className={styles.previewQuote} style={{ fontFamily: bodyStack }}>{SAMPLE.quote}</blockquote>
                        <pre className={styles.previewMono}>{SAMPLE.mono}</pre>
                    </div>
                </div>

                <section className={shell.section}>
                    <span className={shell.label}>Export</span>
                    <pre className={styles.codeBlock}>{exportCss}</pre>
                </section>
            </div>
        </div>
    );
}
