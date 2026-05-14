'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import ShortcutsCheatsheet from './ShortcutsCheatsheet';

/**
 * Map of single-letter codes used after pressing `g` (vim-style nav).
 * Keys are lowercase; values are the route they jump to.
 */
const GO_TARGETS: Record<string, string> = {
    h: '/',
    m: '/moodboard',
    f: '/fonts',
    s: '/settings',
    c: '/clipboard',
    n: '/notes-pad',
    d: '/diff',
    j: '/json-formatter',
    p: '/pomodoro',
    k: '/markdown-preview',
};

export const GO_TARGET_LABELS: { combo: string; label: string }[] = [
    { combo: 'g h', label: 'Home' },
    { combo: 'g m', label: 'Moodboard' },
    { combo: 'g f', label: 'Fonts' },
    { combo: 'g s', label: 'Settings' },
    { combo: 'g c', label: 'Clipboard' },
    { combo: 'g n', label: 'Notes' },
    { combo: 'g d', label: 'Diff' },
    { combo: 'g j', label: 'JSON' },
    { combo: 'g k', label: 'Markdown' },
    { combo: 'g p', label: 'Pomodoro' },
];

const G_MODE_TIMEOUT_MS = 1200;

function isTypingTarget(el: EventTarget | null): boolean {
    if (!(el instanceof HTMLElement)) return false;
    if (el.isContentEditable) return true;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export default function GlobalShortcuts() {
    const router = useRouter();
    const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
    const [gMode, setGMode] = useState(false);
    const gModeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        function clearGMode() {
            setGMode(false);
            if (gModeTimerRef.current) {
                clearTimeout(gModeTimerRef.current);
                gModeTimerRef.current = null;
            }
        }

        function onKey(e: KeyboardEvent) {
            if (isTypingTarget(e.target)) return;

            // `?` opens the cheatsheet. Shift is typically held — match on key
            // rather than code so any keyboard layout works.
            if (e.key === '?') {
                e.preventDefault();
                setCheatsheetOpen(true);
                return;
            }

            if (gMode) {
                const target = GO_TARGETS[e.key.toLowerCase()];
                if (target) {
                    e.preventDefault();
                    router.push(target);
                }
                clearGMode();
                return;
            }

            if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                setGMode(true);
                if (gModeTimerRef.current) clearTimeout(gModeTimerRef.current);
                gModeTimerRef.current = setTimeout(clearGMode, G_MODE_TIMEOUT_MS);
            }
        }

        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            if (gModeTimerRef.current) clearTimeout(gModeTimerRef.current);
        };
    }, [gMode, router]);

    return (
        <>
            {gMode && <div className="clay-g-indicator" aria-hidden="true">g</div>}
            <ShortcutsCheatsheet open={cheatsheetOpen} onClose={() => setCheatsheetOpen(false)} />
        </>
    );
}
