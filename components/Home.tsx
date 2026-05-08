import Link from 'next/link';
import MoodboardDemo from './MoodboardDemo';
import styles from './Home.module.css';

interface ToolCard {
    label: string;
    href: string;
    desc: string;
    glyph: string;
    tag: string;
    variant: 'pink' | 'teal' | 'lav' | 'peach' | 'ochre' | 'cream';
    darkTag?: boolean;
}

// ── Design tools — the ones that don't have a Figma equivalent we'd lose to ──
const designTools: ToolCard[] = [
    { label: 'Contrast',       href: '/color/contrast', desc: 'WCAG ratios + colour-blindness preview for any fg/bg pair.',         glyph: '◐', tag: 'a11y',   variant: 'cream' },
    { label: 'Bezier',         href: '/css/bezier',     desc: 'Drag handles to design easing curves with a live motion preview.',   glyph: '∿', tag: 'Motion', variant: 'lav' },
    { label: 'Token lab',      href: '/assets/tokens',  desc: 'Translate colour tokens between CSS, Tailwind, and W3C tokens.json.', glyph: '⌗', tag: 'Tokens', variant: 'peach' },
    { label: 'SVG viewer',     href: '/assets/svg',     desc: 'Render any SVG, inspect dimensions, strip metadata.',                glyph: '⌬', tag: 'Assets', variant: 'pink',  darkTag: true },
    { label: 'Image kit',      href: '/assets/image',   desc: 'Drop an image to get base64, dimensions, and a full favicon set.',    glyph: '◰', tag: 'Assets', variant: 'ochre' },
    { label: 'Gemini imagery', href: '/gemini',         desc: 'Generate placeholder art from a prompt with Imagen via the Gemini API.', glyph: '✦', tag: 'AI',     variant: 'teal',  darkTag: true },
];

// ── Code & utility tools — pure dev work, not Figma-overlap ──
const codeTools: ToolCard[] = [
    { label: 'Diff Checker',     href: '/diff',             desc: 'Side-by-side text diff with merge buttons and scroll-sync.',     glyph: '⇄',  tag: 'Code',    variant: 'pink', darkTag: true },
    { label: 'JSON Formatter',   href: '/json-formatter',   desc: 'Format, validate, minify and tree-view JSON in real time.',      glyph: '{}', tag: 'Code',    variant: 'ochre' },
    { label: 'Paste & compare',  href: '/compare',          desc: 'Render two HTML/CSS snippets in sandboxed iframes for QA.',      glyph: '⏃',  tag: 'Code',    variant: 'lav' },
    { label: 'Markdown Preview', href: '/markdown-preview', desc: 'Live two-pane GFM editor with light syntax highlighting.',       glyph: '¶',  tag: 'Code',    variant: 'cream' },
    { label: 'Clipboard',        href: '/clipboard',        desc: 'Tabbed scratchpad with line numbers, persistent across sessions.', glyph: '⧉', tag: 'Code',   variant: 'peach' },
    { label: 'Download',         href: '/download',         desc: 'One-keystroke save of whatever’s on your clipboard.',        glyph: '↓',  tag: 'Utility', variant: 'cream' },
    { label: 'CSV Viewer',       href: '/csv-viewer',       desc: 'Parse, sort, search and export CSV — all in the browser.',       glyph: '▦',  tag: 'Utility', variant: 'peach' },
    { label: 'JWT Decoder',      href: '/jwt-decoder',      desc: 'Decode and inspect JWT header and payload claims.',              glyph: '⚿',  tag: 'Utility', variant: 'lav' },
    { label: 'Pomodoro',         href: '/pomodoro',         desc: 'Focus timer with optional posture monitoring on webcam.',        glyph: '◔',  tag: 'Focus',   variant: 'teal',  darkTag: true },
    { label: 'Notes Pad',        href: '/notes-pad',        desc: 'Personal scratchpad notes — saved per user.',                    glyph: '≡',  tag: 'Utility', variant: 'pink', darkTag: true },
];

function Card({ c }: { c: ToolCard }) {
    return (
        <Link href={c.href} className={`${styles.card} ${styles[c.variant]}`}>
            <div>
                <div className={styles.cardHead}>
                    <span className={styles.cardGlyph}>{c.glyph}</span>
                    <span className={`${styles.cardTag} ${c.darkTag ? styles.cardTagDark : ''}`}>
                        {c.tag}
                    </span>
                </div>
                <h3 className={styles.cardTitle}>{c.label}</h3>
                <p className={styles.cardDesc}>{c.desc}</p>
            </div>
            <span className={styles.cardFoot}>
                Open <span className={styles.cardArrow}>→</span>
            </span>
        </Link>
    );
}

export default function Home() {
    return (
        <div className={styles.scroll}>
            <div className={styles.container}>
                <section className={styles.hero}>
                    <div>
                        <span className={styles.heroEyebrow}>Workshop · alpha</span>
                        <h1 className={styles.heroTitle}>
                            A warmer place to <span className={styles.heroAccent}>design</span> in.
                        </h1>
                        <p className={styles.heroSub}>
                            A moodboard for the references that inspire you, a fontbook for the
                            type you collect, and a small kit of dev tools you reach for between
                            the big ones.
                        </p>
                        <div className={styles.heroActions}>
                            <Link
                                href="/moodboard"
                                className={`${styles.btnPrimary} clay-gradient-border clay-gradient-border-animated`}
                            >
                                Open moodboard
                            </Link>
                            <Link href="/fonts" className={styles.btnSecondary}>Browse fonts →</Link>
                        </div>
                    </div>

                    <MoodboardDemo />
                </section>

                {/* ── Headline cards: Moodboard + Fonts ── */}
                <section>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Inspiration</div>
                            <h2 className={styles.sectionTitle}>Save what you love.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            Two libraries that build over time. Drop a link, drop an image,
                            drop a font file — we keep them organised, tagged, and instantly
                            visible.
                        </p>
                    </header>
                    <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <Link
                            href="/moodboard"
                            className={`${styles.card} ${styles.pink} clay-gradient-border clay-gradient-border-animated`}
                        >
                            <div>
                                <div className={styles.cardHead}>
                                    <span className={styles.cardGlyph}>✿</span>
                                    <span className={`${styles.cardTag} ${styles.cardTagDark}`}>Moodboard</span>
                                </div>
                                <h3 className={styles.cardTitle}>Moodboard</h3>
                                <p className={styles.cardDesc}>
                                    Bento-grid of saved links and uploaded pictures. Tag in iOS-style
                                    colours, refresh previews, click out to source. All saved per user.
                                </p>
                                <div className={styles.cardFeatures}>
                                    <span className={styles.cardFeature}>⌕ Paste any URL</span>
                                    <span className={styles.cardFeature}>⬆ Drop images</span>
                                    <span className={styles.cardFeature}>⬧ iOS colour tags</span>
                                </div>
                            </div>
                            <span className={styles.cardFoot}>
                                Open moodboard <span className={styles.cardArrow}>→</span>
                            </span>
                        </Link>
                        <Link
                            href="/fonts"
                            className={`${styles.card} ${styles.lav} clay-gradient-border clay-gradient-border-animated`}
                        >
                            <div>
                                <div className={styles.cardHead}>
                                    <span className={styles.cardGlyph}>Aa</span>
                                    <span className={styles.cardTag}>fontbook · new</span>
                                </div>
                                <h3 className={styles.cardTitle}>fontbook</h3>
                                <p className={styles.cardDesc}>
                                    Your personal type library. Browse 65+ curated Google Fonts,
                                    paste foundry links, or upload your own files — every card
                                    renders the family live in real time.
                                </p>
                                <div className={styles.cardFeatures}>
                                    <span className={styles.cardFeature}>✦ 65+ Google Fonts</span>
                                    <span className={styles.cardFeature}>⬆ Upload .woff2/.otf</span>
                                    <span className={styles.cardFeature}>⌕ Search & filter</span>
                                </div>
                            </div>
                            <span className={styles.cardFoot}>
                                Open fontbook <span className={styles.cardArrow}>→</span>
                            </span>
                        </Link>
                    </div>
                </section>

                {/* ── Design tools — for moments you don't want to open Figma ── */}
                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Design tools</div>
                            <h2 className={styles.sectionTitle}>For when Figma is overkill.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            Quick reference utilities — contrast checks, easing curves, token
                            translations, asset prep — that all end in copyable CSS or JSON.
                        </p>
                    </header>
                    <div className={styles.grid}>
                        {designTools.map((c) => <Card key={c.href} c={c} />)}
                    </div>
                </section>

                {/* ── Code & utility tools ── */}
                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Code & utility</div>
                            <h2 className={styles.sectionTitle}>The small things, fast.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            JSON, diffs, markdown, clipboard, JWT, CSV, focus timer, notes —
                            the moments between commits. All client-side.
                        </p>
                    </header>
                    <div className={styles.grid}>
                        {codeTools.map((c) => <Card key={c.href} c={c} />)}
                    </div>
                </section>

                <footer className={styles.footer}>
                    <span>des/toolkit · alpha</span>
                    <span>Press ⌘K to search tools</span>
                </footer>
            </div>
        </div>
    );
}
