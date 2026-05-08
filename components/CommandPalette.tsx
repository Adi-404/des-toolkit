'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './CommandPalette.module.css';

interface ToolEntry {
    label: string;
    href: string;
    desc: string;
    swatch: string;
    glyph: string;
    category: string;
}

const tools: ToolEntry[] = [
    { label: 'Moodboard',     href: '/moodboard',        desc: 'Save and tag design inspiration links + pictures', swatch: '#ff4d8b', glyph: '✿', category: 'Inspiration' },
    { label: 'Fonts',         href: '/fonts',            desc: 'Save Google Fonts links and uploaded font files',  swatch: '#b8a4ed', glyph: 'Aa', category: 'Inspiration' },
    { label: 'Contrast',      href: '/color/contrast',   desc: 'WCAG ratios + colour-blindness preview',           swatch: '#f5f0e0', glyph: '◐', category: 'Design' },
    { label: 'Bezier',        href: '/css/bezier',       desc: 'Cubic-bezier easing with motion preview',          swatch: '#b8a4ed', glyph: '∿', category: 'Design' },
    { label: 'Token lab',     href: '/assets/tokens',    desc: 'Translate CSS ⇄ Tailwind ⇄ tokens.json',           swatch: '#b8a4ed', glyph: '⌗', category: 'Design' },
    { label: 'SVG viewer',    href: '/assets/svg',       desc: 'Render and lightly clean up SVG markup',           swatch: '#ff4d8b', glyph: '⌬', category: 'Design' },
    { label: 'Image kit',     href: '/assets/image',     desc: 'Base64, dimensions, favicon set',                  swatch: '#e8b94a', glyph: '◰', category: 'Design' },
    { label: 'Gemini imagery', href: '/gemini',          desc: 'Generate images from a prompt with Imagen',        swatch: '#b8a4ed', glyph: '✦', category: 'AI' },
    { label: 'Diff Checker',  href: '/diff',             desc: 'Side-by-side text diff with merge',                swatch: '#f5f0e0', glyph: '⇄', category: 'Code' },
    { label: 'JSON Formatter', href: '/json-formatter',  desc: 'Format, validate and tree-view JSON',              swatch: '#e8b94a', glyph: '{}', category: 'Code' },
    { label: 'Paste & compare', href: '/compare',        desc: 'Render two HTML/CSS snippets side-by-side',        swatch: '#ff4d8b', glyph: '⏃', category: 'Code' },
    { label: 'Markdown Preview', href: '/markdown-preview', desc: 'Live two-pane GFM editor',                      swatch: '#f5f0e0', glyph: '¶', category: 'Code' },
    { label: 'Clipboard',     href: '/clipboard',        desc: 'Tabbed scratchpad with line numbers',              swatch: '#ff4d8b', glyph: '⧉', category: 'Code' },
    { label: 'Download',      href: '/download',         desc: 'One-key save of clipboard text or image',          swatch: '#f5f0e0', glyph: '↓', category: 'Utility' },
    { label: 'CSV Viewer',    href: '/csv-viewer',       desc: 'Sort, search, export CSV',                         swatch: '#ffb084', glyph: '▦', category: 'Utility' },
    { label: 'JWT Decoder',   href: '/jwt-decoder',      desc: 'Decode JWT header + payload',                      swatch: '#b8a4ed', glyph: '⚿', category: 'Utility' },
    { label: 'Notes Pad',     href: '/notes-pad',        desc: 'Personal scratchpad notes',                        swatch: '#ffb084', glyph: '≡', category: 'Utility' },
    { label: 'Pomodoro',      href: '/pomodoro',         desc: 'Focus timer with optional posture check',          swatch: '#1a3a3a', glyph: '◔', category: 'Utility' },
];

interface Props {
    onClose: () => void;
}

export default function CommandPalette({ onClose }: Props) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const [prevQuery, setPrevQuery] = useState(query);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return tools;
        return tools.filter((t) =>
            t.label.toLowerCase().includes(q) ||
            t.desc.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        );
    }, [query]);

    // Reset highlight when the query changes (allowed during render in React 19).
    if (query !== prevQuery) {
        setPrevQuery(query);
        setActiveIdx(0);
    }

    function go(href: string) {
        onClose();
        router.push(href);
    }

    function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const target = filtered[activeIdx];
            if (target) go(target.href);
        }
    }

    function isLight(hex: string): boolean {
        const c = hex.replace('#', '');
        const r = parseInt(c.slice(0, 2), 16);
        const g = parseInt(c.slice(2, 4), 16);
        const b = parseInt(c.slice(4, 6), 16);
        return (r * 0.299 + g * 0.587 + b * 0.114) > 160;
    }

    return (
        <div
            className={styles.backdrop}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            onClick={onClose}
            onKeyDown={onKey}
        >
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.searchRow}>
                    <span className={styles.searchIcon}>⌕</span>
                    <input
                        autoFocus
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search tools, formats, actions…"
                        className={styles.input}
                    />
                </div>

                {filtered.length === 0 ? (
                    <div className={styles.empty}>No matches for &ldquo;{query}&rdquo;</div>
                ) : (
                    <ul className={styles.list}>
                        {filtered.map((t, i) => (
                            <li key={t.href}>
                                <button
                                    type="button"
                                    className={`${styles.item} ${i === activeIdx ? styles.itemActive : ''}`}
                                    onClick={() => go(t.href)}
                                    onMouseEnter={() => setActiveIdx(i)}
                                >
                                    <span
                                        className={styles.swatch}
                                        style={{
                                            background: t.swatch,
                                            color: isLight(t.swatch) ? 'var(--clay-ink)' : 'var(--clay-on-primary)',
                                        }}
                                    >
                                        {t.glyph}
                                    </span>
                                    <span className={styles.itemBody}>
                                        <span className={styles.itemLabel}>{t.label}</span>
                                        <span className={styles.itemDesc}>{t.desc}</span>
                                    </span>
                                    <span className={styles.itemHint}>{t.category}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className={styles.footer}>
                    <span><span className={styles.footerKbd}>↑↓</span> navigate</span>
                    <span><span className={styles.footerKbd}>↵</span> open</span>
                    <span><span className={styles.footerKbd}>esc</span> close</span>
                </div>
            </div>
        </div>
    );
}
