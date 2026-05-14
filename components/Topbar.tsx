'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import styles from './Topbar.module.css';
import CommandPalette from './CommandPalette';
import QuickAddPopover from './QuickAddPopover';
import { useSettings } from '@/contexts/SettingsContext';
import { usePlatform } from '@/lib/use-platform';
import { FOCUS_MOODBOARD_ADD, FOCUS_FONTBOOK_ADD } from '@/lib/topbar-events';

// NEXT_PUBLIC_* values are inlined at build time, so this is a static check
// equivalent to "did the developer wire up Clerk for this build?".
const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

interface ToolEntry {
    label: string;
    href: string;
    glyph: string;
    desc: string;
    swatch: string;
}

interface ToolSection {
    title: string;
    tools: ToolEntry[];
}

interface MenuItem {
    id: string;
    label: string;
    href: string;
    matchPrefixes: string[];
    /** Glyph shown as a small colored badge next to the label */
    glyph?: string;
    /** Background color of the glyph badge */
    glyphColor?: string;
    /** CSS custom property value for the active-dot color */
    dotColor?: string;
    sections?: ToolSection[];
}

const menu: MenuItem[] = [
    {
        id: 'moodboard',
        label: 'Moodboard',
        href: '/moodboard',
        glyph: '✿',
        glyphColor: '#ff4d8b',
        dotColor: '#ff4d8b',
        matchPrefixes: ['/moodboard'],
    },
    {
        id: 'fonts',
        label: 'Fonts',
        href: '/fonts',
        glyph: 'Aa',
        glyphColor: '#b8a4ed',
        dotColor: '#b8a4ed',
        matchPrefixes: ['/fonts'],
    },
    {
        id: 'tools',
        label: 'Tools',
        href: '/color/contrast',
        glyph: '⬡',
        glyphColor: '#e8b94a',
        dotColor: '#e8b94a',
        matchPrefixes: [
            '/color/', '/css/', '/assets/', '/diff', '/json-formatter',
            '/markdown-preview', '/clipboard', '/download', '/csv-viewer',
            '/jwt-decoder', '/notes-pad', '/notes/', '/compare',
        ],
        sections: [
            {
                title: 'Design',
                tools: [
                    { label: 'Contrast',          href: '/color/contrast',  glyph: '◐', desc: 'WCAG ratio + colour-blindness preview',     swatch: '#f5f0e0' },
                    { label: 'Bezier',             href: '/css/bezier',      glyph: '∿', desc: 'Cubic-bezier easing with motion preview',    swatch: '#b8a4ed' },
                    { label: 'Token lab',          href: '/assets/tokens',   glyph: '⌗', desc: 'CSS ⇄ Tailwind ⇄ tokens.json translator',    swatch: '#b8a4ed' },
                    { label: 'SVG viewer',         href: '/assets/svg',      glyph: '⌬', desc: 'Render and lightly clean up SVG',            swatch: '#ff4d8b' },
                    { label: 'Image kit',          href: '/assets/image',    glyph: '◰', desc: 'Base64, dimensions, favicon set',            swatch: '#e8b94a' },
                    { label: 'Palette extractor',  href: '/color/palette',   glyph: '◈', desc: 'Extract dominant colors from any image',     swatch: '#a4d4c5' },
                ],
            },
            {
                title: 'Code',
                tools: [
                    { label: 'Diff Checker',     href: '/diff',             glyph: '⇄',  desc: 'Side-by-side text diff with merge',    swatch: '#f5f0e0' },
                    { label: 'JSON Formatter',   href: '/json-formatter',   glyph: '{}', desc: 'Format, validate, tree-view JSON',      swatch: '#e8b94a' },
                    { label: 'Paste & compare',  href: '/compare',          glyph: '⏃',  desc: 'Two HTML/CSS panes side-by-side',       swatch: '#ff4d8b' },
                    { label: 'Markdown Preview', href: '/markdown-preview', glyph: '¶',  desc: 'Live two-pane GFM editor',              swatch: '#f5f0e0' },
                    { label: 'Clipboard',        href: '/clipboard',        glyph: '⧉',  desc: 'Tabbed scratchpad with line numbers',   swatch: '#ff4d8b' },
                ],
            },
            {
                title: 'Utility',
                tools: [
                    { label: 'Download',    href: '/download',     glyph: '↓', desc: 'One-key save of clipboard text or image', swatch: '#f5f0e0' },
                    { label: 'CSV Viewer',  href: '/csv-viewer',   glyph: '▦', desc: 'Sort, search, export CSV',                swatch: '#ffb084' },
                    { label: 'JWT Decoder', href: '/jwt-decoder',  glyph: '⚿', desc: 'Decode JWT header + payload',             swatch: '#b8a4ed' },
                    { label: 'Notes Pad',   href: '/notes-pad',    glyph: '≡', desc: 'Personal scratchpad notes',               swatch: '#ffb084' },
                ],
            },
        ],
    },
    {
        id: 'pomodoro',
        label: 'Focus',
        href: '/pomodoro',
        glyph: '◔',
        glyphColor: '#1a3a3a',
        dotColor: '#1a3a3a',
        matchPrefixes: ['/pomodoro'],
    },
];

const HOVER_OPEN_DELAY = 80;
const HOVER_CLOSE_DELAY = 180;

export default function Topbar() {
    const pathname = usePathname();
    const { settings } = useSettings();
    const { modLabel } = usePlatform();
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [openGroupId, setOpenGroupId] = useState<string | null>(null);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddAnchor, setQuickAddAnchor] = useState<DOMRect | null>(null);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const navRef = useRef<HTMLElement>(null);

    const paletteKey = settings.shortcuts.paletteKey;
    const paletteHotkeyLabel = `${modLabel}${paletteKey.toUpperCase()}`;

    // Decide which mode the right-side CTA is in based on the current route.
    // - On the moodboard or fontbook, the CTA focuses that page's URL input
    //   (no point navigating somewhere you're already at).
    // - Everywhere else, it opens a quick-add popover that drops a link
    //   straight into the moodboard without leaving the current page.
    const ctaMode: 'focus-moodboard' | 'focus-fonts' | 'quick-add' =
        pathname.startsWith('/moodboard') ? 'focus-moodboard'
        : pathname.startsWith('/fonts')   ? 'focus-fonts'
        : 'quick-add';

    const ctaLabel =
        ctaMode === 'focus-moodboard' ? '+ Add link'
        : ctaMode === 'focus-fonts'   ? '+ Add font'
        : '+ Quick add';

    function handleCtaClick() {
        if (ctaMode === 'focus-moodboard') {
            window.dispatchEvent(new Event(FOCUS_MOODBOARD_ADD));
            return;
        }
        if (ctaMode === 'focus-fonts') {
            window.dispatchEvent(new Event(FOCUS_FONTBOOK_ADD));
            return;
        }
        setQuickAddAnchor(ctaRef.current?.getBoundingClientRect() ?? null);
        setQuickAddOpen(true);
    }

    const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    function clearTimers() {
        if (openTimerRef.current) { clearTimeout(openTimerRef.current); openTimerRef.current = null; }
        if (closeTimerRef.current) { clearTimeout(closeTimerRef.current); closeTimerRef.current = null; }
    }

    function scheduleOpen(id: string) {
        clearTimers();
        openTimerRef.current = setTimeout(() => setOpenGroupId(id), HOVER_OPEN_DELAY);
    }

    function scheduleClose() {
        clearTimers();
        closeTimerRef.current = setTimeout(() => setOpenGroupId(null), HOVER_CLOSE_DELAY);
    }

    // Close on route change. Render-phase state derivation avoids the
    // react-hooks/set-state-in-effect rule.
    const [lastPathname, setLastPathname] = useState(pathname);
    if (lastPathname !== pathname) {
        setLastPathname(pathname);
        if (openGroupId !== null) setOpenGroupId(null);
    }

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === paletteKey) {
                e.preventDefault();
                setPaletteOpen((o) => !o);
            }
            if (e.key === 'Escape') {
                setPaletteOpen(false);
                setOpenGroupId(null);
            }
        }
        function onClick(e: MouseEvent) {
            if (!navRef.current) return;
            const inNav = navRef.current.contains(e.target as Node);
            const inDropdown = dropdownRef.current?.contains(e.target as Node);
            if (!inNav && !inDropdown) setOpenGroupId(null);
        }
        window.addEventListener('keydown', onKey);
        window.addEventListener('mousedown', onClick);
        return () => {
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('mousedown', onClick);
        };
    }, [paletteKey]);

    function isItemActive(item: MenuItem): boolean {
        return item.matchPrefixes.some((p) =>
            pathname === p || pathname.startsWith(p.endsWith('/') ? p : p + '/'),
        );
    }

    return (
        <>
            <header className={styles.nav} ref={navRef}>
                <Link href="/" className={styles.brand}>
                    <span>des</span>
                    <span className={styles.brandSlash}>/</span>
                    <span>toolkit</span>
                    <span className={styles.brandBadge}>alpha</span>
                </Link>

                <div className={styles.divider} aria-hidden="true" />

                <nav className={styles.menu}>
                    {menu.map((item) => {
                        const active = isItemActive(item);
                        const open = openGroupId === item.id;
                        const hasDropdown = !!item.sections;
                        return (
                            <div
                                key={item.id}
                                className={styles.groupWrap}
                                onMouseEnter={() => hasDropdown && scheduleOpen(item.id)}
                                onMouseLeave={() => hasDropdown && scheduleClose()}
                            >
                                <Link
                                    href={item.href}
                                    className={`${styles.menuItem} ${active ? styles.menuItemActive : ''} ${open ? styles.menuItemOpen : ''}`}
                                    style={active && item.dotColor ? { '--item-dot-color': item.dotColor } as React.CSSProperties : undefined}
                                    onClick={() => setOpenGroupId(null)}
                                >
                                    {item.glyph && (
                                        <span
                                            className={styles.navGlyph}
                                            style={{ background: item.glyphColor ?? 'var(--clay-surface-strong)' }}
                                            aria-hidden="true"
                                        >
                                            {item.glyph}
                                        </span>
                                    )}
                                    <span>{item.label}</span>
                                    {hasDropdown && (
                                        <span className={styles.menuChevron} aria-hidden="true">▾</span>
                                    )}
                                </Link>

                                {hasDropdown && open && createPortal(
                                    <div
                                        ref={dropdownRef}
                                        className={styles.dropdownWide}
                                        onMouseEnter={clearTimers}
                                        onMouseLeave={scheduleClose}
                                    >
                                        {item.sections!.map((section) => (
                                            <div key={section.title} className={styles.dropdownSection}>
                                                <div className={styles.dropdownSectionTitle}>
                                                    {section.title}
                                                </div>
                                                <div className={styles.dropdownSectionItems}>
                                                    {section.tools.map((tool) => {
                                                        const here = pathname === tool.href;
                                                        return (
                                                            <Link
                                                                key={tool.href}
                                                                href={tool.href}
                                                                className={`${styles.dropdownItem} ${here ? styles.dropdownItemActive : ''}`}
                                                                onClick={() => setOpenGroupId(null)}
                                                            >
                                                                <span
                                                                    className={styles.dropdownGlyph}
                                                                    style={{ background: tool.swatch }}
                                                                >
                                                                    {tool.glyph}
                                                                </span>
                                                                <span className={styles.dropdownBody}>
                                                                    <span className={styles.dropdownLabel}>{tool.label}</span>
                                                                    <span className={styles.dropdownDesc}>{tool.desc}</span>
                                                                </span>
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>,
                                    document.body
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className={styles.right}>
                    <Link
                        href="/settings"
                        className={styles.iconBtn}
                        title="Settings"
                        aria-label="Settings"
                    >
                        ⚙
                    </Link>
                    <button
                        type="button"
                        className={styles.searchBtn}
                        onClick={() => setPaletteOpen(true)}
                        aria-label="Open command palette"
                    >
                        <span className={styles.searchIcon}>⌕ Search tools…</span>
                        <span className={styles.searchKbd}>{paletteHotkeyLabel}</span>
                    </button>

                    {CLERK_ENABLED ? (
                        <>
                            <SignedOut>
                                <Link href="/sign-in" className={styles.signInBtn}>Sign in</Link>
                                <Link href="/sign-up" className={`${styles.cta} clay-gradient-border clay-gradient-border-animated`}>
                                    Sign up
                                </Link>
                            </SignedOut>
                            <SignedIn>
                                <button
                                    ref={ctaRef}
                                    type="button"
                                    onClick={handleCtaClick}
                                    className={`${styles.cta} clay-gradient-border clay-gradient-border-animated`}
                                    title={
                                        ctaMode === 'focus-moodboard' ? 'Jump to the URL input on this page'
                                        : ctaMode === 'focus-fonts'   ? 'Jump to the URL input on this page'
                                        : 'Save a link to your moodboard from any page'
                                    }
                                >
                                    {ctaLabel}
                                </button>
                                <UserButton
                                    appearance={{ elements: { avatarBox: { width: 36, height: 36 } } }}
                                    afterSignOutUrl="/"
                                />
                            </SignedIn>
                        </>
                    ) : (
                        <Link href="/moodboard" className={`${styles.cta} clay-gradient-border clay-gradient-border-animated`}>
                            Open moodboard
                        </Link>
                    )}
                </div>
            </header>

            {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
            <QuickAddPopover
                open={quickAddOpen}
                anchorRect={quickAddAnchor}
                onClose={() => setQuickAddOpen(false)}
            />
        </>
    );
}
