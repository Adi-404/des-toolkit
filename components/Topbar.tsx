'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Topbar.module.css';
import CommandPalette from './CommandPalette';

interface MenuItem {
    label: string;
    href: string;
    /** Optional path prefixes that should also light the item up. */
    matchPrefixes?: string[];
}

const menu: MenuItem[] = [
    { label: 'Moodboard',  href: '/moodboard',      matchPrefixes: ['/moodboard'] },
    { label: 'Color lab',  href: '/color/contrast', matchPrefixes: ['/color/', '/color-picker'] },
    { label: 'CSS lab',    href: '/css/shadow',     matchPrefixes: ['/css/'] },
    { label: 'Type lab',   href: '/type/scale',     matchPrefixes: ['/type/', '/markdown-preview'] },
    { label: 'Assets lab', href: '/assets/svg',     matchPrefixes: ['/assets/', '/download'] },
    { label: 'AI lab',     href: '/gemini',         matchPrefixes: ['/gemini'] },
];

export default function Topbar() {
    const pathname = usePathname();
    const [paletteOpen, setPaletteOpen] = useState(false);

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setPaletteOpen((o) => !o);
            }
            if (e.key === 'Escape') setPaletteOpen(false);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    return (
        <>
            <header className={styles.nav}>
                <Link href="/" className={styles.brand}>
                    <span>des</span>
                    <span className={styles.brandDot}>/</span>
                    <span className={styles.brandAccent}>toolkit</span>
                </Link>

                <nav className={styles.menu}>
                    {menu.map((item) => {
                        const active = item.href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(item.href) ||
                              (item.matchPrefixes?.some((p) => pathname.startsWith(p)) ?? false);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.right}>
                    <button
                        type="button"
                        className={styles.searchBtn}
                        onClick={() => setPaletteOpen(true)}
                        aria-label="Open command palette"
                    >
                        <span className={styles.searchIcon}>⌕ Search tools…</span>
                        <span className={styles.searchKbd}>⌘K</span>
                    </button>
                    <Link href="/moodboard" className={styles.cta}>Open moodboard</Link>
                </div>
            </header>

            {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
        </>
    );
}
