'use client';

import { useMemo, useState } from 'react';
import { hexToRgb, rgbToHex } from '@/lib/color';
import shell from './ToolPage.module.css';
import styles from './Shadow.module.css';

interface ShadowLayer {
    id: number;
    enabled: boolean;
    inset: boolean;
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string; // hex
    alpha: number; // 0..1
}

let lid = 0;
const newLayer = (overrides: Partial<ShadowLayer> = {}): ShadowLayer => ({
    id: ++lid,
    enabled: true,
    inset: false,
    x: 0,
    y: 8,
    blur: 24,
    spread: -4,
    color: '#0a0a0a',
    alpha: 0.18,
    ...overrides,
});

function hexAlphaToRgba(hex: string, alpha: number): string {
    const rgb = hexToRgb(hex) ?? { r: 0, g: 0, b: 0 };
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha.toFixed(3).replace(/\.?0+$/, '')})`;
}

function layerToCss(l: ShadowLayer): string {
    const rgba = hexAlphaToRgba(l.color, l.alpha);
    return `${l.inset ? 'inset ' : ''}${l.x}px ${l.y}px ${l.blur}px ${l.spread}px ${rgba}`;
}

export default function Shadow() {
    const [layers, setLayers] = useState<ShadowLayer[]>([
        newLayer({ y: 4,  blur: 12, spread: -2, alpha: 0.10 }),
        newLayer({ y: 16, blur: 32, spread: -8, alpha: 0.16 }),
    ]);
    const [activeId, setActiveId] = useState<number>(layers[0]?.id);
    const [dark, setDark] = useState(false);
    const [copied, setCopied] = useState(false);

    const css = useMemo(() => {
        const enabled = layers.filter((l) => l.enabled);
        if (enabled.length === 0) return 'none';
        return enabled.map(layerToCss).join(', ');
    }, [layers]);

    function update(id: number, patch: Partial<ShadowLayer>) {
        setLayers((cur) => cur.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    }

    function commitColor(id: number, raw: string, fallback: string) {
        const v = raw.trim().startsWith('#') ? raw.trim() : '#' + raw.trim();
        const parsed = hexToRgb(v);
        update(id, { color: parsed ? rgbToHex(parsed) : fallback });
    }

    function addLayer() {
        if (layers.length >= 6) return;
        const next = newLayer({ y: 12, blur: 28, alpha: 0.14 });
        setLayers((cur) => [...cur, next]);
        setActiveId(next.id);
    }

    function removeLayer(id: number) {
        if (layers.length <= 1) return;
        setLayers((cur) => cur.filter((l) => l.id !== id));
        if (activeId === id) setActiveId(layers[0].id);
    }

    function duplicateLayer(id: number) {
        if (layers.length >= 6) return;
        const src = layers.find((l) => l.id === id);
        if (!src) return;
        const idx = layers.findIndex((l) => l.id === id);
        const dup = newLayer({ ...src });
        const next = [...layers];
        next.splice(idx + 1, 0, dup);
        setLayers(next);
        setActiveId(dup.id);
    }

    async function copyCss() {
        await navigator.clipboard.writeText(`box-shadow: ${css};`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>CSS · shadow</div>
                        <h1 className={shell.title}>Shadow playground.</h1>
                        <p className={shell.lede}>
                            Stack up to six shadow layers, fine-tune offset, blur, spread, and
                            alpha for each, and copy a single composed CSS rule.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnPrimary} onClick={copyCss}>
                            {copied ? '✓ Copied' : '⧉ Copy CSS'}
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={`${styles.previewCard} ${dark ? styles.previewCardDark : ''}`}>
                        <div className={`${styles.previewToggle} ${dark ? styles.previewToggleDark : ''}`}>
                            <button
                                className={`${styles.toggleBtn} ${!dark ? styles.toggleBtnActive : ''}`}
                                onClick={() => setDark(false)}
                            >
                                Light
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${dark ? styles.toggleBtnActive : ''}`}
                                onClick={() => setDark(true)}
                            >
                                Dark
                            </button>
                        </div>
                        <div
                            className={`${styles.previewSubject} ${dark ? styles.previewSubjectDark : ''}`}
                            style={{ boxShadow: css }}
                        >
                            Drop sample
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <div>
                            <span className={shell.label}>Layers · {layers.length}/6</span>
                            <div className={styles.layers}>
                                {layers.map((l, idx) => {
                                    const isActive = l.id === activeId;
                                    return (
                                        <div
                                            key={l.id}
                                            className={`${styles.layer} ${isActive ? styles.layerActive : ''} ${!l.enabled ? styles.layerOff : ''}`}
                                            onClick={() => setActiveId(l.id)}
                                        >
                                            <div className={styles.layerHead}>
                                                <span
                                                    className={styles.layerSwatch}
                                                    style={{ background: hexAlphaToRgba(l.color, l.alpha) }}
                                                />
                                                <span className={styles.layerLabel}>Layer {idx + 1}{l.inset ? ' · inset' : ''}</span>
                                                <button
                                                    className={styles.layerToggle}
                                                    onClick={(e) => { e.stopPropagation(); update(l.id, { enabled: !l.enabled }); }}
                                                    aria-label={l.enabled ? 'Disable layer' : 'Enable layer'}
                                                >
                                                    {l.enabled ? '●' : '○'}
                                                </button>
                                            </div>

                                            {isActive && (
                                                <>
                                                    <div className={styles.layerControls}>
                                                        <div className={styles.controlField}>
                                                            <span className={styles.controlLabel}>X</span>
                                                            <input className={styles.controlNumber} type="number" value={l.x} onChange={(e) => update(l.id, { x: +e.target.value })} />
                                                        </div>
                                                        <div className={styles.controlField}>
                                                            <span className={styles.controlLabel}>Y</span>
                                                            <input className={styles.controlNumber} type="number" value={l.y} onChange={(e) => update(l.id, { y: +e.target.value })} />
                                                        </div>
                                                        <div className={styles.controlField}>
                                                            <span className={styles.controlLabel}>Blur</span>
                                                            <input className={styles.controlNumber} type="number" min={0} value={l.blur} onChange={(e) => update(l.id, { blur: Math.max(0, +e.target.value) })} />
                                                        </div>
                                                        <div className={styles.controlField}>
                                                            <span className={styles.controlLabel}>Spread</span>
                                                            <input className={styles.controlNumber} type="number" value={l.spread} onChange={(e) => update(l.id, { spread: +e.target.value })} />
                                                        </div>
                                                    </div>

                                                    <div className={styles.controlField}>
                                                        <span className={styles.controlLabel}>Color · alpha</span>
                                                        <div className={styles.controlColor}>
                                                            <input
                                                                type="color"
                                                                value={l.color}
                                                                onChange={(e) => update(l.id, { color: e.target.value })}
                                                                aria-label="Shadow colour"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={l.color.toUpperCase()}
                                                                onChange={(e) => update(l.id, { color: e.target.value })}
                                                                onBlur={(e) => commitColor(l.id, e.target.value, '#000000')}
                                                                spellCheck={false}
                                                                maxLength={7}
                                                            />
                                                            <input
                                                                className={styles.controlNumber}
                                                                style={{ width: 64 }}
                                                                type="number"
                                                                step={0.01}
                                                                min={0}
                                                                max={1}
                                                                value={l.alpha}
                                                                onChange={(e) => update(l.id, { alpha: Math.max(0, Math.min(1, +e.target.value)) })}
                                                            />
                                                        </div>
                                                    </div>

                                                    <label className={styles.insetRow}>
                                                        <input
                                                            type="checkbox"
                                                            checked={l.inset}
                                                            onChange={(e) => update(l.id, { inset: e.target.checked })}
                                                        />
                                                        Inset shadow
                                                    </label>

                                                    <div className={styles.layerActions}>
                                                        <button className={styles.smallBtn} onClick={() => duplicateLayer(l.id)} disabled={layers.length >= 6}>Duplicate</button>
                                                        <button className={`${styles.smallBtn} ${styles.smallBtnDanger}`} onClick={() => removeLayer(l.id)} disabled={layers.length <= 1}>Remove</button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                className={shell.btnSecondary}
                                onClick={addLayer}
                                disabled={layers.length >= 6}
                                style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                            >
                                + Add layer
                            </button>
                        </div>
                    </div>
                </div>

                <section className={shell.section}>
                    <span className={shell.label}>CSS output</span>
                    <pre className={styles.codeBlock}>{`box-shadow: ${css};`}</pre>
                </section>
            </div>
        </div>
    );
}
