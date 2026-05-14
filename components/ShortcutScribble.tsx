'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSettings, type WheelModifier } from '@/contexts/SettingsContext';
import { usePlatform } from '@/lib/use-platform';
import styles from './ShortcutScribble.module.css';

const WHEEL_LABEL: Record<WheelModifier, string> = {
    Alt: 'Alt',
    Control: 'Ctrl',
    Shift: 'Shift',
    Meta: '⌘',
};

type Variant = 'inline' | 'footer';

interface Props {
    variant?: Variant;
    /** Override copy for the lead-in text. */
    children?: React.ReactNode;
}

interface Hint {
    /** kbd chips, in left-to-right order. Use string[] for combos like ['Shift', '?']. */
    keys: string[];
    label: string;
}

/** How long each hint stays visible before rotating to the next one. */
const CYCLE_MS = 3800;

export default function ShortcutScribble({ variant = 'inline', children }: Props) {
    const { settings } = useSettings();
    const { modLabel } = usePlatform();

    const hints = useMemo<Hint[]>(() => [
        { keys: [`${modLabel}${settings.shortcuts.paletteKey.toUpperCase()}`], label: 'finds anything' },
        { keys: [WHEEL_LABEL[settings.shortcuts.wheelModifier]],                label: 'summons the wheel' },
        { keys: ['Shift', '?'],                                                 label: 'opens the cheatsheet' },
    ], [modLabel, settings.shortcuts.paletteKey, settings.shortcuts.wheelModifier]);

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setIndex(i => (i + 1) % hints.length), CYCLE_MS);
        return () => clearInterval(id);
    }, [hints.length]);

    // When the user rebinds a key, the hint contents change. Reset to index 0
    // so the freshly rebound key shows up first, before drifting back.
    useEffect(() => { setIndex(0); }, [hints]);

    const active = hints[index];

    return (
        <span className={`${styles.scribble} ${styles[variant]}`}>
            {children ?? <span className={styles.lead}>psst —</span>}
            {/* The key on .line forces a remount so the fade-in keyframe replays
                cleanly on every cycle without us having to track playback state. */}
            <span className={styles.line} key={index}>
                {active.keys.map((k, i) => (
                    <span key={i} className={styles.kbdGroup}>
                        <kbd className={styles.kbd}>{k}</kbd>
                        {i < active.keys.length - 1 && <span className={styles.plus}>+</span>}
                    </span>
                ))}
                <span className={styles.word}>{active.label}</span>
            </span>
            <span className={styles.dots} aria-hidden="true">
                {hints.map((_, i) => (
                    <span
                        key={i}
                        className={`${styles.dot} ${i === index ? styles.dotActive : ''}`}
                    />
                ))}
            </span>
        </span>
    );
}
