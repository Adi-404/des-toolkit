'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_SHORTCUTS, useSettings, type WheelModifier } from '@/contexts/SettingsContext';
import { usePlatform } from '@/lib/use-platform';
import styles from './SettingsPage.module.css';

const WHEEL_MODIFIER_OPTIONS: { value: WheelModifier; label: string }[] = [
    { value: 'Alt',     label: 'Alt' },
    { value: 'Control', label: 'Ctrl' },
    { value: 'Shift',   label: 'Shift' },
    { value: 'Meta',    label: '⌘ / Win' },
];

export default function SettingsPage() {
    const { settings, update } = useSettings();
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragIndexRef = useRef<number | null>(null);

    const [recordingPalette, setRecordingPalette] = useState(false);
    const { modLabel } = usePlatform();

    useEffect(() => {
        if (!recordingPalette) return;
        function onKey(e: KeyboardEvent) {
            e.preventDefault();
            if (e.key === 'Escape') { setRecordingPalette(false); return; }
            // Want a single letter/digit that's not itself a modifier.
            if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
                update({
                    shortcuts: { ...settings.shortcuts, paletteKey: e.key.toLowerCase() },
                });
                setRecordingPalette(false);
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [recordingPalette, settings.shortcuts, update]);

    function onDragStart(index: number) {
        dragIndexRef.current = index;
    }

    function onDragOver(e: React.DragEvent, index: number) {
        e.preventDefault();
        setDragOverIndex(index);
    }

    function onDrop(toIndex: number) {
        const from = dragIndexRef.current;
        if (from === null || from === toIndex) { setDragOverIndex(null); return; }
        const tools = [...settings.tools];
        const [item] = tools.splice(from, 1);
        tools.splice(toIndex, 0, item);
        update({ tools });
        setDragOverIndex(null);
        dragIndexRef.current = null;
    }

    function toggleTool(href: string) {
        update({
            tools: settings.tools.map(t => t.href === href ? { ...t, enabled: !t.enabled } : t),
        });
    }

    return (
        <div className={styles.scroll}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.eyebrow}>des/toolkit · settings</div>
                    <h1 className={styles.title}>
                        Preferences
                        <span className={styles.titleNote}>make it yours</span>
                    </h1>
                    <p className={styles.lede}>Synced to your account when signed in. Changes apply immediately.</p>
                </header>

                {/* ── Right-click menu toggle ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Right-click wheel</h2>
                    <div className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.rowText}>
                                <div className={styles.rowLabel}>Enable radial menu</div>
                                <div className={styles.rowDesc}>
                                    Shows the tool wheel on right-click or pressing <kbd className={styles.kbd}>{WHEEL_MODIFIER_OPTIONS.find(o => o.value === settings.shortcuts.wheelModifier)?.label ?? 'Alt'}</kbd>
                                </div>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={settings.contextMenuEnabled}
                                className={`${styles.toggle} ${settings.contextMenuEnabled ? styles.toggleOn : ''}`}
                                onClick={() => update({ contextMenuEnabled: !settings.contextMenuEnabled })}
                            >
                                <span className={styles.toggleThumb} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ── Keyboard shortcuts ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Keyboard shortcuts</h2>
                    <p className={styles.sectionDesc}>
                        Pick the keys you reach for. <span className={styles.script}>change anytime</span>
                        {' '}<span className={styles.scriptHint}>· press <kbd className={styles.kbd}>?</kbd> anywhere for the full list</span>
                    </p>
                    <div className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.rowText}>
                                <div className={styles.rowLabel}>Command palette</div>
                                <div className={styles.rowDesc}>
                                    Held with <kbd className={styles.kbd}>{modLabel}</kbd> to open the search bar
                                </div>
                            </div>
                            <button
                                type="button"
                                className={`${styles.recorder} ${recordingPalette ? styles.recorderActive : ''}`}
                                onClick={() => setRecordingPalette(r => !r)}
                                aria-label="Record command palette shortcut"
                            >
                                {recordingPalette
                                    ? <span className={styles.recorderHint}>press any key…</span>
                                    : <span><kbd className={styles.kbd}>{modLabel}</kbd> + <kbd className={styles.kbd}>{settings.shortcuts.paletteKey.toUpperCase()}</kbd></span>}
                            </button>
                        </div>
                        <div className={styles.rowDivider} />
                        <div className={styles.row}>
                            <div className={styles.rowText}>
                                <div className={styles.rowLabel}>Radial wheel</div>
                                <div className={styles.rowDesc}>
                                    Hold this key to summon the wheel at your cursor
                                </div>
                            </div>
                            <div className={styles.segmented} role="radiogroup" aria-label="Radial wheel modifier">
                                {WHEEL_MODIFIER_OPTIONS.map(opt => {
                                    const active = settings.shortcuts.wheelModifier === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            role="radio"
                                            aria-checked={active}
                                            className={`${styles.segment} ${active ? styles.segmentActive : ''}`}
                                            onClick={() => update({
                                                shortcuts: { ...settings.shortcuts, wheelModifier: opt.value },
                                            })}
                                        >
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {(settings.shortcuts.paletteKey !== DEFAULT_SHORTCUTS.paletteKey ||
                          settings.shortcuts.wheelModifier !== DEFAULT_SHORTCUTS.wheelModifier) && (
                            <div className={styles.rowFoot}>
                                <button
                                    type="button"
                                    className={styles.resetLink}
                                    onClick={() => update({ shortcuts: { ...DEFAULT_SHORTCUTS } })}
                                >
                                    Reset to defaults
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Tool wheel order ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Tool wheel items</h2>
                    <p className={styles.sectionDesc}>
                        Drag to reorder · toggle to show or hide in the wheel
                    </p>
                    <div className={styles.toolList}>
                        {settings.tools.map((tool, index) => (
                            <div
                                key={tool.href}
                                draggable
                                onDragStart={() => onDragStart(index)}
                                onDragOver={(e) => onDragOver(e, index)}
                                onDragLeave={() => setDragOverIndex(null)}
                                onDrop={() => onDrop(index)}
                                onDragEnd={() => setDragOverIndex(null)}
                                className={[
                                    styles.toolRow,
                                    dragOverIndex === index ? styles.toolRowOver : '',
                                    !tool.enabled ? styles.toolRowDisabled : '',
                                ].join(' ')}
                            >
                                <span className={styles.grip} aria-hidden="true">⠿</span>
                                <span
                                    className={styles.toolGlyph}
                                    style={{ fontSize: tool.icon.length > 2 ? '11px' : '18px' }}
                                    aria-hidden="true"
                                >
                                    {tool.icon}
                                </span>
                                <span className={styles.toolLabel}>{tool.label}</span>
                                <span className={styles.toolHref}>{tool.href}</span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={tool.enabled}
                                    aria-label={`${tool.enabled ? 'Hide' : 'Show'} ${tool.label}`}
                                    className={`${styles.toggle} ${styles.toggleSm} ${tool.enabled ? styles.toggleOn : ''}`}
                                    onClick={() => toggleTool(tool.href)}
                                >
                                    <span className={styles.toggleThumb} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
