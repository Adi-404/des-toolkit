'use client';

import { useRef, useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
    const { settings, update } = useSettings();
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const dragIndexRef = useRef<number | null>(null);

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
                    <h1 className={styles.title}>Preferences</h1>
                    <p className={styles.lede}>Saved in your browser. Changes apply immediately.</p>
                </header>

                {/* ── Right-click menu toggle ── */}
                <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Right-click wheel</h2>
                    <div className={styles.card}>
                        <div className={styles.row}>
                            <div className={styles.rowText}>
                                <div className={styles.rowLabel}>Enable radial menu</div>
                                <div className={styles.rowDesc}>
                                    Shows the tool wheel on right-click or pressing <kbd className={styles.kbd}>Alt</kbd>
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
