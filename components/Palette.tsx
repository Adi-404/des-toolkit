'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    hexToRgb, rgbToHex, ramp, harmonies, readableOn, type RGB,
} from '@/lib/color';
import shell from './ToolPage.module.css';
import styles from './Palette.module.css';

const DEFAULT_BASE = '#ff4d8b';

const SHARING_PRESETS = ['#ff4d8b', '#1a3a3a', '#b8a4ed', '#ffb084', '#e8b94a', '#3b82f6'];

function hexLabel(stop: RGB) {
    return rgbToHex(stop).toUpperCase();
}

export default function Palette() {
    const [base, setBase] = useState(DEFAULT_BASE);
    const [hexInput, setHexInput] = useState(DEFAULT_BASE);
    const [toast, setToast] = useState<string | null>(null);
    const [prevBase, setPrevBase] = useState(base);

    if (base !== prevBase) {
        setPrevBase(base);
        setHexInput(base);
    }

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 1400);
        return () => clearTimeout(t);
    }, [toast]);

    const baseRgb = useMemo<RGB>(() => hexToRgb(base) ?? { r: 255, g: 77, b: 139 }, [base]);
    const ramp9 = useMemo(() => ramp(baseRgb, 9), [baseRgb]);
    const harmonyList = useMemo(() => harmonies(baseRgb), [baseRgb]);

    function applyBase(hex: string) {
        const parsed = hexToRgb(hex);
        if (parsed) setBase(rgbToHex(parsed));
    }

    function commitHex(raw: string) {
        const v = raw.trim().startsWith('#') ? raw.trim() : '#' + raw.trim();
        const parsed = hexToRgb(v);
        if (parsed) applyBase(rgbToHex(parsed));
        else setHexInput(base);
    }

    async function copy(value: string) {
        await navigator.clipboard.writeText(value);
        setToast(`Copied ${value}`);
    }

    function exportFormat(format: 'css' | 'tailwind' | 'json') {
        if (format === 'css') {
            const lines = ramp9.map((s, i) => `  --palette-${(i + 1) * 100}: ${rgbToHex(s)};`).join('\n');
            return `:root {\n${lines}\n}`;
        }
        if (format === 'tailwind') {
            const obj = ramp9.reduce((acc, s, i) => ({ ...acc, [(i + 1) * 100]: rgbToHex(s) }), {});
            return JSON.stringify({ palette: obj }, null, 2);
        }
        return JSON.stringify(ramp9.map((s, i) => ({ step: (i + 1) * 100, hex: rgbToHex(s) })), null, 2);
    }

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Color · palette</div>
                        <h1 className={shell.title}>Palette generator.</h1>
                        <p className={shell.lede}>
                            Drop in a base colour and pull a nine-step ramp plus the five classic
                            harmonies. Click any swatch to copy, or export the ramp as CSS or Tailwind.
                        </p>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={shell.card}>
                        <div className={styles.controls}>
                            <div>
                                <span className={shell.label}>Base colour</span>
                                <div className={styles.fieldRow}>
                                    <input
                                        type="color"
                                        className={styles.swatch}
                                        value={base}
                                        onChange={(e) => applyBase(e.target.value)}
                                        aria-label="Base colour picker"
                                    />
                                    <input
                                        type="text"
                                        className={`${shell.input} ${shell.inputMono}`}
                                        value={hexInput}
                                        onChange={(e) => setHexInput(e.target.value)}
                                        onBlur={() => commitHex(hexInput)}
                                        onKeyDown={(e) => e.key === 'Enter' && commitHex(hexInput)}
                                        spellCheck={false}
                                        maxLength={7}
                                    />
                                </div>
                            </div>

                            <div
                                className={styles.bigPreview}
                                style={{ background: base, color: rgbToHex(readableOn(baseRgb)) }}
                            >
                                <span className={styles.bigPreviewHex}>{base.toUpperCase()}</span>
                            </div>

                            <div>
                                <span className={shell.label}>Quick start</span>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                    {SHARING_PRESETS.map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => applyBase(p)}
                                            aria-label={`Use ${p}`}
                                            style={{
                                                width: 28, height: 28, borderRadius: 8,
                                                background: p, border: '1px solid var(--clay-hairline)',
                                                cursor: 'pointer', padding: 0,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className={shell.label}>Export</span>
                                <div className={styles.exportRow}>
                                    <button className={shell.btnSecondary} onClick={() => copy(exportFormat('css'))}>CSS variables</button>
                                    <button className={shell.btnSecondary} onClick={() => copy(exportFormat('tailwind'))}>Tailwind config</button>
                                    <button className={shell.btnSecondary} onClick={() => copy(exportFormat('json'))}>JSON</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.results}>
                        <div className={styles.block}>
                            <div className={styles.blockHead}>
                                <h2 className={styles.blockTitle}>Nine-step ramp</h2>
                                <span className={styles.blockSub}>From shade 100 (lightest) through to shade 900 (darkest).</span>
                            </div>
                            <div className={styles.row}>
                                {ramp9.map((stop, i) => {
                                    const hex = hexLabel(stop);
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            className={styles.swatchTile}
                                            style={{ background: hex, color: rgbToHex(readableOn(stop)) }}
                                            onClick={() => copy(hex)}
                                            aria-label={`Copy ${hex}`}
                                        >
                                            <span className={styles.swatchTileHex}>{hex}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {harmonyList.map((h) => (
                            <div key={h.name} className={styles.block}>
                                <div className={styles.blockHead}>
                                    <h2 className={styles.blockTitle}>{h.name}</h2>
                                    <span className={styles.blockSub}>{h.description}</span>
                                </div>
                                <div className={styles.row}>
                                    {h.swatches.map((stop, i) => {
                                        const hex = hexLabel(stop);
                                        return (
                                            <button
                                                key={i}
                                                type="button"
                                                className={styles.swatchTile}
                                                style={{ background: hex, color: rgbToHex(readableOn(stop)) }}
                                                onClick={() => copy(hex)}
                                                aria-label={`Copy ${hex}`}
                                            >
                                                <span className={styles.swatchTileHex}>{hex}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {toast && <div className={styles.copyToast}>{toast}</div>}
            </div>
        </div>
    );
}
