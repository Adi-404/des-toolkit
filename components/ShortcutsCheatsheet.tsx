'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSettings, type WheelModifier } from '@/contexts/SettingsContext';
import { usePlatform } from '@/lib/use-platform';
import { GO_TARGET_LABELS } from './GlobalShortcuts';
import styles from './ShortcutsCheatsheet.module.css';

const WHEEL_LABEL: Record<WheelModifier, string> = {
    Alt: 'Alt',
    Control: 'Ctrl',
    Shift: 'Shift',
    Meta: '⌘',
};

interface Props {
    open: boolean;
    onClose: () => void;
}

interface Row {
    keys: string[];   // ['⌘', 'K'] or ['g', 'h']
    label: string;
    aside?: string;   // optional crayon doodle line
}

export default function ShortcutsCheatsheet({ open, onClose }: Props) {
    const { settings } = useSettings();
    const { modLabel } = usePlatform();

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' || e.key === '?') {
                e.preventDefault();
                onClose();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;
    if (typeof document === 'undefined') return null;

    const paletteRow: Row = {
        keys: [modLabel, settings.shortcuts.paletteKey.toUpperCase()],
        label: 'Open command palette',
        aside: 'finds anything',
    };

    const wheelRow: Row = {
        keys: [WHEEL_LABEL[settings.shortcuts.wheelModifier]],
        label: 'Summon the radial wheel',
        aside: 'hold the key',
    };

    const generalRows: Row[] = [
        paletteRow,
        wheelRow,
        { keys: ['?'], label: 'Open this cheatsheet' },
        { keys: ['Esc'], label: 'Close any overlay' },
    ];

    const navRows: Row[] = GO_TARGET_LABELS.map(({ combo, label }) => {
        const parts = combo.split(' ');
        return { keys: parts, label: `Jump to ${label}` };
    });

    return createPortal(
        <div className={styles.backdrop} onClick={onClose}>
            <div
                className={styles.panel}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Keyboard shortcuts"
            >
                <header className={styles.header}>
                    <div className={styles.eyebrow}>cheatsheet</div>
                    <h2 className={styles.title}>
                        Keyboard shortcuts
                        <span className={styles.titleDoodle}>scribbled for you</span>
                    </h2>
                    <button
                        type="button"
                        className={styles.closeBtn}
                        onClick={onClose}
                        aria-label="Close shortcuts"
                    >
                        ×
                    </button>
                </header>

                <div className={styles.columns}>
                    <section className={styles.column}>
                        <h3 className={styles.colTitle}>General</h3>
                        <ul className={styles.list}>
                            {generalRows.map((row, i) => <RowItem key={i} row={row} index={i} />)}
                        </ul>
                    </section>

                    <section className={styles.column}>
                        <h3 className={styles.colTitle}>Go to <span className={styles.colTitleScript}>—press g, then…</span></h3>
                        <ul className={styles.list}>
                            {navRows.map((row, i) => <RowItem key={i} row={row} index={i + generalRows.length} />)}
                        </ul>
                    </section>
                </div>

                <footer className={styles.footer}>
                    <span className={styles.footScript}>change them anytime in</span>
                    <a href="/settings" className={styles.footLink} onClick={onClose}>/settings</a>
                </footer>
            </div>
        </div>,
        document.body,
    );
}

function RowItem({ row, index }: { row: Row; index: number }) {
    return (
        <li className={styles.row} style={{ animationDelay: `${index * 24}ms` }}>
            <span className={styles.combo}>
                {row.keys.map((k, i) => (
                    <span key={i} className={styles.comboPart}>
                        <kbd className={styles.kbd}>{k}</kbd>
                        {i < row.keys.length - 1 && <span className={styles.sep}>then</span>}
                    </span>
                ))}
            </span>
            <span className={styles.label}>{row.label}</span>
            {row.aside && <span className={styles.aside}>{row.aside}</span>}
        </li>
    );
}
