'use client';

import { useMemo, useState } from 'react';
import shell from './ToolPage.module.css';
import styles from './SpacingScale.module.css';

type ScaleType = 'linear' | 'modular' | 'fibonacci';

const STEP_NAMES = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl', '3xl', '4xl', 'section'];

const BREAKPOINTS: { name: string; width: number; label: string }[] = [
    { name: 'mobile',  width: 380,  label: '380' },
    { name: 'sm',      width: 640,  label: '640' },
    { name: 'md',      width: 768,  label: '768' },
    { name: 'lg',      width: 1024, label: '1024' },
    { name: 'xl',      width: 1280, label: '1280' },
];

function buildScale(base: number, type: ScaleType, ratio: number): number[] {
    if (type === 'linear') {
        // 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 — using base as the unit
        const seeds = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32];
        return seeds.map((s) => s * base);
    }
    if (type === 'modular') {
        return STEP_NAMES.map((_, i) => Math.round(base * Math.pow(ratio, i)));
    }
    // Fibonacci
    const out: number[] = [];
    let a = base, b = base;
    out.push(a);
    out.push(b);
    while (out.length < STEP_NAMES.length) {
        const next = a + b;
        out.push(next);
        a = b; b = next;
    }
    return out;
}

export default function SpacingScale() {
    const [base, setBase] = useState(4);
    const [scaleType, setScaleType] = useState<ScaleType>('linear');
    const [ratio, setRatio] = useState(1.5);
    const [breakpoint, setBreakpoint] = useState<typeof BREAKPOINTS[number]>(BREAKPOINTS[2]);
    const [copied, setCopied] = useState(false);

    const scale = useMemo(() => buildScale(base, scaleType, ratio), [base, scaleType, ratio]);

    const max = scale[scale.length - 1] || 1;

    const css = useMemo(() => {
        const lines = scale.map((v, i) => `  --space-${STEP_NAMES[i]}: ${v}px;`);
        return `:root {\n${lines.join('\n')}\n}`;
    }, [scale]);

    async function copy(text: string) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }

    const cardRowClass = breakpoint.width >= 1024 ? styles.breakCardRowLg
        : breakpoint.width >= 640 ? styles.breakCardRowMd
        : '';

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Type · spacing</div>
                        <h1 className={shell.title}>Spacing & breakpoints.</h1>
                        <p className={shell.lede}>
                            Build a spacing scale from a base unit, see each token visualised, and
                            preview a sample layout at the standard breakpoints.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnPrimary} onClick={() => copy(css)}>
                            {copied ? '✓ Copied' : '⧉ Copy CSS'}
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={shell.card}>
                        <div className={styles.controls}>
                            <div className={styles.field}>
                                <span className={shell.label}>Base unit</span>
                                <div className={styles.row}>
                                    <input
                                        className={styles.numberInput}
                                        type="number"
                                        min={2}
                                        max={16}
                                        step={1}
                                        value={base}
                                        onChange={(e) => setBase(Math.max(2, Math.min(16, +e.target.value || 4)))}
                                    />
                                    <span className={styles.unitTag}>px</span>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <span className={shell.label}>Scale</span>
                                <div className={styles.toggleRow}>
                                    {(['linear', 'modular', 'fibonacci'] as ScaleType[]).map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            className={`${styles.toggleBtn} ${scaleType === t ? styles.toggleBtnActive : ''}`}
                                            onClick={() => setScaleType(t)}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {scaleType === 'modular' && (
                                <div className={styles.field}>
                                    <span className={shell.label}>Ratio · {ratio}</span>
                                    <input
                                        type="range"
                                        min={1.125}
                                        max={2}
                                        step={0.0625}
                                        value={ratio}
                                        onChange={(e) => setRatio(+e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.results}>
                        <div className={styles.scaleList}>
                            {scale.map((v, i) => (
                                <div
                                    key={i}
                                    className={styles.scaleRow}
                                    onClick={() => copy(`${v}px`)}
                                    title={`Copy ${v}px`}
                                >
                                    <span className={styles.scaleStep}>{STEP_NAMES[i]}</span>
                                    <span className={styles.scaleSize}>{v}px</span>
                                    <div className={styles.scaleBar} style={{ width: `${(v / max) * 100}%` }} />
                                    <span className={styles.scaleCopy}>⧉</span>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className={styles.breakHeader}>
                                <span className={shell.label}>Breakpoint preview</span>
                                <span className={styles.breakWidthBadge}>{breakpoint.width}px</span>
                            </div>
                            <div className={styles.breakChips}>
                                {BREAKPOINTS.map((b) => (
                                    <button
                                        key={b.name}
                                        type="button"
                                        className={`${styles.breakChip} ${breakpoint.name === b.name ? styles.breakChipActive : ''}`}
                                        onClick={() => setBreakpoint(b)}
                                    >
                                        {b.name} · {b.label}
                                    </button>
                                ))}
                            </div>

                            <div className={styles.breakStage} style={{ marginTop: 12 }}>
                                <div
                                    className={styles.breakViewport}
                                    style={{ maxWidth: `${breakpoint.width}px` }}
                                >
                                    <div className={styles.breakInner}>
                                        <span className={styles.breakKicker}>Section · preview</span>
                                        <h3 className={styles.breakHead}>The kit fits the viewport.</h3>
                                        <p className={styles.breakBody}>
                                            Resize the breakpoint chips above to see how the layout reflows.
                                            Cards collapse from three columns at lg, two at md, one on mobile.
                                        </p>
                                        <div className={`${styles.breakCardRow} ${cardRowClass}`}>
                                            <div className={styles.breakCard}>Tile A</div>
                                            <div className={styles.breakCard}>Tile B</div>
                                            <div className={styles.breakCard}>Tile C</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <pre className={styles.codeBlock}>{css}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
