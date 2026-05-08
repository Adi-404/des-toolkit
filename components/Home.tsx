import Link from 'next/link';
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

// Cycle the saturated palette so no two adjacent cards share a color.
const colorLab: ToolCard[] = [
    { label: 'Color Picker', href: '/color-picker',     desc: 'Pick and convert across HEX · RGB · HSL · HSB with a live ramp.', glyph: '◉',  tag: 'Color', variant: 'teal',  darkTag: true },
    { label: 'Contrast',     href: '/color/contrast',   desc: 'Check WCAG ratios and preview colour-blindness scenarios.',       glyph: '◐',  tag: 'a11y',  variant: 'cream' },
    { label: 'Palette',      href: '/color/palette',    desc: 'Generate ramps and harmonies; export as CSS or Tailwind.',        glyph: '◎',  tag: 'Color', variant: 'lav' },
    { label: 'Gradient',     href: '/color/gradient',   desc: 'Build linear, radial, and conic gradients with copyable CSS.',    glyph: '◍',  tag: 'Color', variant: 'peach' },
];

const cssLab: ToolCard[] = [
    { label: 'Shadow',  href: '/css/shadow',  desc: 'Stack up to six box-shadow layers with offset, blur, and alpha.', glyph: '▣',  tag: 'CSS', variant: 'pink',  darkTag: true },
    { label: 'Radius',  href: '/css/radius',  desc: 'Tune per-corner border-radius — including elliptical squircles.', glyph: '◖',  tag: 'CSS', variant: 'ochre' },
    { label: 'Bezier',  href: '/css/bezier',  desc: 'Drag control handles to design easing curves with live motion.',  glyph: '∿',  tag: 'CSS', variant: 'lav' },
    { label: 'Diff',    href: '/diff',        desc: 'Side-by-side text diff with merge buttons and scroll-sync.',      glyph: '⇄',  tag: 'Text', variant: 'cream' },
];

const typeLab: ToolCard[] = [
    { label: 'Type scale',     href: '/type/scale',       desc: 'Build a modular type ramp from base + ratio; export as CSS or Tailwind.', glyph: 'Aa', tag: 'Type', variant: 'teal',  darkTag: true },
    { label: 'Font pairing',   href: '/type/pairing',     desc: 'Preview heading + body Google Fonts pairs on real editorial copy.',     glyph: 'Tt', tag: 'Type', variant: 'peach' },
    { label: 'Spacing',        href: '/type/spacing',     desc: 'Spacing scale + breakpoint preview of a sample layout.',                glyph: '⇿',  tag: 'Type', variant: 'lav' },
    { label: 'Markdown',       href: '/markdown-preview', desc: 'Live two-pane GitHub-flavored markdown editor in the new design.',     glyph: '¶',  tag: 'Text', variant: 'cream' },
];

const assetsLab: ToolCard[] = [
    { label: 'SVG viewer',  href: '/assets/svg',    desc: 'Render any SVG, inspect dimensions, strip metadata and round numbers.', glyph: '⌬', tag: 'Assets', variant: 'pink',  darkTag: true },
    { label: 'Image kit',   href: '/assets/image',  desc: 'Drop an image to get base64, dimensions, and a full favicon set.',     glyph: '◰', tag: 'Assets', variant: 'ochre' },
    { label: 'Token lab',   href: '/assets/tokens', desc: 'Translate colour tokens between CSS, Tailwind, and W3C tokens.json.',  glyph: '⌗', tag: 'Tokens', variant: 'lav' },
    { label: 'Download',    href: '/download',      desc: 'One-keystroke save of whatever’s on your clipboard, in the new design.', glyph: '↓', tag: 'Utility', variant: 'cream' },
];

const frontendLab: ToolCard[] = [
    { label: 'Paste & compare', href: '/compare',        desc: 'Render two HTML/CSS snippets in sandboxed iframes for variant review.', glyph: '⏃',  tag: 'Frontend', variant: 'pink',  darkTag: true },
    { label: 'JSON Formatter',  href: '/json-formatter', desc: 'Format, validate, minify and tree-view JSON in the new design.',       glyph: '{}', tag: 'Data',     variant: 'ochre' },
    { label: 'Clipboard',       href: '/clipboard',      desc: 'Tabbed scratchpad with line numbers, persistent across sessions.',     glyph: '⧉',  tag: 'Text',     variant: 'cream' },
];

const aiLab: ToolCard[] = [
    { label: 'Gemini imagery', href: '/gemini', desc: 'Generate placeholder art from a prompt with Google Imagen via the Gemini API.', glyph: '✦', tag: 'AI · new', variant: 'lav' },
];

const cards: ToolCard[] = [
    { label: 'CSV Viewer',     href: '/csv-viewer',     desc: 'Parse, sort, search and export CSV — all in the browser.',  glyph: '▦',  tag: 'Data',  variant: 'peach' },
    { label: 'JWT Decoder',    href: '/jwt-decoder',    desc: 'Decode and inspect JWT header and payload claims.',         glyph: '⚿',  tag: 'Data',  variant: 'lav' },
    { label: 'Pomodoro',       href: '/pomodoro',       desc: 'Focus timer with optional posture monitoring on webcam.',   glyph: '◔',  tag: 'Focus', variant: 'teal',  darkTag: true },
];

const upcoming: { label: string; desc: string }[] = [];

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
                            Tools for colour, type, CSS and assets — and a moodboard to keep
                            the references that got you there. Drop a link from anywhere and
                            we&rsquo;ll fetch the preview.
                        </p>
                        <div className={styles.heroActions}>
                            <Link href="/moodboard" className={styles.btnPrimary}>Open moodboard</Link>
                            <Link href="/color-picker" className={styles.btnSecondary}>Try a tool →</Link>
                        </div>
                    </div>

                    <div className={styles.heroArt} aria-hidden="true">
                        <div className={styles.mountains}>
                            <div className={styles.sun} />
                            <div className={`${styles.mountain} ${styles.m1}`} />
                            <div className={`${styles.mountain} ${styles.m2}`} />
                            <div className={`${styles.mountain} ${styles.m3}`} />
                            <div className={styles.ground} />
                        </div>
                        <span className={styles.heroArtLabel}>des/toolkit</span>
                    </div>
                </section>

                <section>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Moodboard · new</div>
                            <h2 className={styles.sectionTitle}>Save what you love.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            Drop in a link from Pinterest, Dribbble, Behance, Canva, Figma —
                            anywhere. We fetch the preview, title and source, and arrange them
                            into named boards.
                        </p>
                    </header>
                    <div className={styles.grid}>
                        <Link href="/moodboard" className={`${styles.card} ${styles.pink}`} style={{ gridColumn: 'span 2' }}>
                            <div>
                                <div className={styles.cardHead}>
                                    <span className={styles.cardGlyph}>✿</span>
                                    <span className={`${styles.cardTag} ${styles.cardTagDark}`}>Inspiration</span>
                                </div>
                                <h3 className={styles.cardTitle}>Open your moodboards</h3>
                                <p className={styles.cardDesc}>
                                    Pinterest-style cards, group by theme, refresh previews,
                                    open back to source. All saved locally to your machine.
                                </p>
                            </div>
                            <span className={styles.cardFoot}>
                                Browse boards <span className={styles.cardArrow}>→</span>
                            </span>
                        </Link>
                        <Link href="/moodboard" className={`${styles.card} ${styles.cream}`}>
                            <div>
                                <div className={styles.cardHead}>
                                    <span className={styles.cardGlyph}>+</span>
                                    <span className={styles.cardTag}>New</span>
                                </div>
                                <h3 className={styles.cardTitle}>Create a board</h3>
                                <p className={styles.cardDesc}>
                                    A fresh board for a project, a colour direction, or a single
                                    afternoon&rsquo;s research.
                                </p>
                            </div>
                            <span className={styles.cardFoot}>
                                Start <span className={styles.cardArrow}>→</span>
                            </span>
                        </Link>
                    </div>
                </section>

                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Color lab</div>
                            <h2 className={styles.sectionTitle}>For colour & a11y.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            A small workshop for picking, checking, harmonising and gradient-ing
                            colours — all client-side, all designed in the Clay system.
                        </p>
                    </header>

                    <div className={styles.grid}>
                        {colorLab.map((c) => (
                            <Link key={c.href} href={c.href} className={`${styles.card} ${styles[c.variant]}`}>
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
                        ))}
                    </div>
                </section>

                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>CSS lab · new</div>
                            <h2 className={styles.sectionTitle}>For shadow, shape, & motion.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            Visual editors for the CSS rules you spend the most time tweaking.
                            Live preview, copyable rule, no surprises.
                        </p>
                    </header>

                    <div className={styles.grid}>
                        {cssLab.map((c) => (
                            <Link key={c.href} href={c.href} className={`${styles.card} ${styles[c.variant]}`}>
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
                        ))}
                    </div>
                </section>

                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Type lab · new</div>
                            <h2 className={styles.sectionTitle}>For type & rhythm.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            Modular type scales, Google Fonts pairings, and a spacing &
                            breakpoint visualiser — the typography end of the toolkit.
                        </p>
                    </header>

                    <div className={styles.grid}>
                        {typeLab.map((c) => (
                            <Link key={c.href} href={c.href} className={`${styles.card} ${styles[c.variant]}`}>
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
                        ))}
                    </div>
                </section>

                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Assets lab · new</div>
                            <h2 className={styles.sectionTitle}>For SVG, images, & tokens.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            The export side of the toolkit — handling raster, vector and design
                            tokens. Drop, render, translate, copy.
                        </p>
                    </header>

                    <div className={styles.grid}>
                        {assetsLab.map((c) => (
                            <Link key={c.href} href={c.href} className={`${styles.card} ${styles[c.variant]}`}>
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
                        ))}
                    </div>
                </section>

                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Frontend lab · new</div>
                            <h2 className={styles.sectionTitle}>For paste & compare.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            Drop in two HTML/CSS variants and review them side-by-side in
                            sandboxed iframes — plus the freshly-restyled Clipboard.
                        </p>
                    </header>

                    <div className={styles.grid}>
                        {frontendLab.map((c) => (
                            <Link key={c.href} href={c.href} className={`${styles.card} ${styles[c.variant]}`}>
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
                        ))}
                    </div>
                </section>

                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>AI lab · new</div>
                            <h2 className={styles.sectionTitle}>For generative imagery.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            Prompt-to-image via Google Imagen on the Gemini API. Bring your own
                            key — it stays on the server, only the prompt leaves your machine.
                        </p>
                    </header>

                    <div className={styles.grid}>
                        {aiLab.map((c) => (
                            <Link key={c.href} href={c.href} className={`${styles.card} ${styles[c.variant]}`}>
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
                        ))}
                    </div>
                </section>

                <section style={{ marginTop: 'var(--clay-space-section)' }}>
                    <header className={styles.sectionHead}>
                        <div>
                            <div className={styles.sectionEyebrow}>Tools · live</div>
                            <h2 className={styles.sectionTitle}>The rest of the kit.</h2>
                        </div>
                        <p className={styles.sectionLede}>
                            CSV, JWT, focus timer — utilities still in their original chrome.
                            They&rsquo;ll graduate to the new design when their turn comes.
                        </p>
                    </header>

                    <div className={styles.grid}>
                        {cards.map((c) => (
                            <Link key={c.href} href={c.href} className={`${styles.card} ${styles[c.variant]}`}>
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
                        ))}
                    </div>
                </section>

                <section className={styles.soonBlock}>
                    <div>
                        <div className={styles.sectionEyebrow}>Roadmap · v1</div>
                        <h2 className={styles.soonHead}>That&rsquo;s the v1 kit.</h2>
                        <p className={styles.soonLede}>
                            Twenty Clay-styled tools across colour, CSS, type, assets, frontend
                            and AI — plus four utilities still in their original chrome. Press
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}> ⌘K</span>
                            anywhere to jump between them.
                        </p>
                    </div>
                    <div className={styles.soonGrid}>
                        {upcoming.map((u) => (
                            <div key={u.label} className={styles.soonItem}>
                                <span className={styles.soonItemLabel}>{u.label}</span>
                                <span className={styles.soonItemDesc}>{u.desc}</span>
                            </div>
                        ))}
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
