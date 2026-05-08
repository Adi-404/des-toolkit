'use client';

import { useEffect, useMemo, useState } from 'react';
import shell from './ToolPage.module.css';
import styles from './TypeScale.module.css';

const RATIOS = [
    { name: 'Minor second',     value: 1.067 },
    { name: 'Major second',     value: 1.125 },
    { name: 'Minor third',      value: 1.2 },
    { name: 'Major third',      value: 1.25 },
    { name: 'Perfect fourth',   value: 1.333 },
    { name: 'Aug. fourth',      value: 1.414 },
    { name: 'Perfect fifth',    value: 1.5 },
    { name: 'Golden ratio',     value: 1.618 },
];

const STEPS = [
    { label: 'caption', power: -2 },
    { label: 'small',   power: -1 },
    { label: 'body',    power: 0 },
    { label: 'lead',    power: 1 },
    { label: 'h4',      power: 2 },
    { label: 'h3',      power: 3 },
    { label: 'h2',      power: 4 },
    { label: 'h1',      power: 5 },
    { label: 'display', power: 6 },
];

const DEFAULT_BASE = 16;
const DEFAULT_RATIO = 1.25;
const DEFAULT_SAMPLE = 'A warmer toolbelt for the front-end craft.';

function lineHeightFor(size: number): number {
    // Smaller text gets looser leading; larger text tightens up.
    if (size <= 14) return 1.6;
    if (size <= 18) return 1.55;
    if (size <= 24) return 1.4;
    if (size <= 36) return 1.2;
    return 1.05;
}

export default function TypeScale() {
    const [base, setBase] = useState(DEFAULT_BASE);
    const [ratio, setRatio] = useState(DEFAULT_RATIO);
    const [sample, setSample] = useState(DEFAULT_SAMPLE);
    const [toast, setToast] = useState<string | null>(null);
    const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 1200);
        return () => clearTimeout(t);
    }, [toast]);

    const scale = useMemo(() => STEPS.map((s) => {
        const size = base * Math.pow(ratio, s.power);
        return {
            label: s.label,
            power: s.power,
            size: Math.round(size * 100) / 100,
            lineHeight: lineHeightFor(size),
        };
    }), [base, ratio]);

    const css = useMemo(() => {
        const lines = scale.map((s) => `  --type-${s.label}-size: ${s.size}px;\n  --type-${s.label}-leading: ${s.lineHeight};`);
        return `:root {\n${lines.join('\n')}\n}`;
    }, [scale]);

    const tailwind = useMemo(() => {
        const obj = scale.reduce((acc, s) => {
            acc[s.label] = [`${s.size}px`, { lineHeight: String(s.lineHeight) }];
            return acc;
        }, {} as Record<string, [string, { lineHeight: string }]>);
        return JSON.stringify({ fontSize: obj }, null, 2);
    }, [scale]);

    async function copy(text: string, format: string) {
        await navigator.clipboard.writeText(text);
        setCopiedFormat(format);
        setToast(`Copied ${format}`);
        setTimeout(() => setCopiedFormat(null), 1200);
    }

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Type · scale</div>
                        <h1 className={shell.title}>Type scale.</h1>
                        <p className={shell.lede}>
                            Build a modular type ramp from a base size and a ratio. Preview each
                            step in your own copy and export as CSS or Tailwind.
                        </p>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={shell.card}>
                        <div className={styles.controls}>
                            <div className={styles.field}>
                                <span className={shell.label}>Base size</span>
                                <div className={styles.row}>
                                    <input
                                        className={styles.numberInput}
                                        type="number"
                                        min={10}
                                        max={32}
                                        step={1}
                                        value={base}
                                        onChange={(e) => setBase(Math.max(10, Math.min(32, +e.target.value || DEFAULT_BASE)))}
                                    />
                                    <span className={styles.unitTag}>px</span>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <span className={shell.label}>Ratio</span>
                                <div className={styles.ratioGrid}>
                                    {RATIOS.map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            className={`${styles.ratioBtn} ${ratio === r.value ? styles.ratioBtnActive : ''}`}
                                            onClick={() => setRatio(r.value)}
                                        >
                                            <span className={styles.ratioName}>{r.name}</span>
                                            <span className={styles.ratioValue}>{r.value}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <span className={shell.label}>Sample text</span>
                                <input
                                    className={`${shell.input}`}
                                    type="text"
                                    value={sample}
                                    onChange={(e) => setSample(e.target.value)}
                                    placeholder="The quick brown fox…"
                                />
                            </div>

                            <div className={styles.field}>
                                <span className={shell.label}>Export</span>
                                <div className={styles.exportRow}>
                                    <button className={shell.btnSecondary} onClick={() => copy(css, 'CSS')}>
                                        {copiedFormat === 'CSS' ? '✓ CSS' : 'CSS variables'}
                                    </button>
                                    <button className={shell.btnSecondary} onClick={() => copy(tailwind, 'Tailwind')}>
                                        {copiedFormat === 'Tailwind' ? '✓ Tailwind' : 'Tailwind config'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.results}>
                        {[...scale].reverse().map((s) => (
                            <div
                                key={s.label}
                                className={styles.scaleRow}
                                onClick={() => copy(`font-size: ${s.size}px; line-height: ${s.lineHeight};`, s.label)}
                            >
                                <span className={styles.scaleStep}>{s.label}</span>
                                <span className={styles.scaleSize}>{s.size}px / {s.lineHeight}</span>
                                <span
                                    className={styles.scaleSample}
                                    style={{ fontSize: `${s.size}px`, lineHeight: s.lineHeight }}
                                >
                                    {sample}
                                </span>
                            </div>
                        ))}
                        <pre className={styles.codeBlock}>{css}</pre>
                    </div>
                </div>

                {toast && <div className={styles.copyToast}>{toast}</div>}
            </div>
        </div>
    );
}
