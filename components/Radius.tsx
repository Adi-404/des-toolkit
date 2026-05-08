'use client';

import { useMemo, useState } from 'react';
import shell from './ToolPage.module.css';
import styles from './Radius.module.css';

type Mode = 'uniform' | 'corners' | 'asymmetric';
type Unit = 'px' | '%';

interface Corner { h: number; v: number; }

const CORNERS: { key: keyof Corners; label: string }[] = [
    { key: 'tl', label: 'Top left' },
    { key: 'tr', label: 'Top right' },
    { key: 'br', label: 'Bottom right' },
    { key: 'bl', label: 'Bottom left' },
];

interface Corners {
    tl: Corner;
    tr: Corner;
    br: Corner;
    bl: Corner;
}

const SHAPES: { name: string; corners: Corners; mode: Mode; unit: Unit }[] = [
    { name: 'Rounded',     corners: { tl: { h: 16, v: 16 }, tr: { h: 16, v: 16 }, br: { h: 16, v: 16 }, bl: { h: 16, v: 16 } }, mode: 'uniform',    unit: 'px' },
    { name: 'Pill',        corners: { tl: { h: 9999, v: 9999 }, tr: { h: 9999, v: 9999 }, br: { h: 9999, v: 9999 }, bl: { h: 9999, v: 9999 } }, mode: 'uniform', unit: 'px' },
    { name: 'Squircle',    corners: { tl: { h: 38, v: 18 }, tr: { h: 38, v: 18 }, br: { h: 38, v: 18 }, bl: { h: 38, v: 18 } }, mode: 'asymmetric', unit: 'px' },
    { name: 'Asymmetric',  corners: { tl: { h: 32, v: 32 }, tr: { h: 8,  v: 8  }, br: { h: 32, v: 32 }, bl: { h: 8,  v: 8  } }, mode: 'corners',    unit: 'px' },
    { name: 'Tab',         corners: { tl: { h: 12, v: 12 }, tr: { h: 12, v: 12 }, br: { h: 0,  v: 0  }, bl: { h: 0,  v: 0  } }, mode: 'corners',    unit: 'px' },
];

function buildCss(corners: Corners, asymmetric: boolean, unit: Unit): string {
    const u = unit;
    if (asymmetric) {
        const h = `${corners.tl.h}${u} ${corners.tr.h}${u} ${corners.br.h}${u} ${corners.bl.h}${u}`;
        const v = `${corners.tl.v}${u} ${corners.tr.v}${u} ${corners.br.v}${u} ${corners.bl.v}${u}`;
        return `${h} / ${v}`;
    }
    return `${corners.tl.h}${u} ${corners.tr.h}${u} ${corners.br.h}${u} ${corners.bl.h}${u}`;
}

export default function Radius() {
    const [mode, setMode] = useState<Mode>('uniform');
    const [unit, setUnit] = useState<Unit>('px');
    const [uniform, setUniform] = useState(16);
    const [corners, setCorners] = useState<Corners>({
        tl: { h: 16, v: 16 }, tr: { h: 16, v: 16 }, br: { h: 16, v: 16 }, bl: { h: 16, v: 16 },
    });
    const [copied, setCopied] = useState(false);

    const effective: Corners = useMemo(() => {
        if (mode === 'uniform') {
            return {
                tl: { h: uniform, v: uniform },
                tr: { h: uniform, v: uniform },
                br: { h: uniform, v: uniform },
                bl: { h: uniform, v: uniform },
            };
        }
        return corners;
    }, [mode, uniform, corners]);

    const css = useMemo(
        () => buildCss(effective, mode === 'asymmetric', unit),
        [effective, mode, unit],
    );

    function updateCorner(key: keyof Corners, axis: 'h' | 'v', value: number) {
        setCorners((cur) => ({ ...cur, [key]: { ...cur[key], [axis]: value } }));
    }

    function applyShape(shape: typeof SHAPES[number]) {
        setCorners(shape.corners);
        setMode(shape.mode);
        setUnit(shape.unit);
        if (shape.mode === 'uniform') setUniform(shape.corners.tl.h);
    }

    async function copyCss() {
        await navigator.clipboard.writeText(`border-radius: ${css};`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    const max = unit === 'px' ? 200 : 50;

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>CSS · radius</div>
                        <h1 className={shell.title}>Border-radius lab.</h1>
                        <p className={shell.lede}>
                            Tune corners individually, switch between symmetric and elliptical
                            (squircle) shapes, and copy a single radius rule.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnPrimary} onClick={copyCss}>
                            {copied ? '✓ Copied' : '⧉ Copy CSS'}
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={styles.previewCard}>
                        <div className={styles.subject} style={{ borderRadius: css }}>
                            <div className={styles.subjectInner} />
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <div>
                            <span className={shell.label}>Mode</span>
                            <div className={styles.modeRow}>
                                <button
                                    className={`${styles.modeBtn} ${mode === 'uniform' ? styles.modeBtnActive : ''}`}
                                    onClick={() => setMode('uniform')}
                                >
                                    Uniform
                                </button>
                                <button
                                    className={`${styles.modeBtn} ${mode === 'corners' ? styles.modeBtnActive : ''}`}
                                    onClick={() => setMode('corners')}
                                >
                                    Per-corner
                                </button>
                                <button
                                    className={`${styles.modeBtn} ${mode === 'asymmetric' ? styles.modeBtnActive : ''}`}
                                    onClick={() => setMode('asymmetric')}
                                >
                                    Squircle
                                </button>
                            </div>
                        </div>

                        <div>
                            <span className={shell.label}>Unit</span>
                            <div className={styles.modeRow}>
                                <button
                                    className={`${styles.modeBtn} ${unit === 'px' ? styles.modeBtnActive : ''}`}
                                    onClick={() => setUnit('px')}
                                >
                                    Pixels
                                </button>
                                <button
                                    className={`${styles.modeBtn} ${unit === '%' ? styles.modeBtnActive : ''}`}
                                    onClick={() => setUnit('%')}
                                >
                                    Percent
                                </button>
                            </div>
                        </div>

                        {mode === 'uniform' ? (
                            <div className={styles.field}>
                                <span className={shell.label}>Radius · {uniform}{unit}</span>
                                <div className={styles.row}>
                                    <input
                                        type="range"
                                        className={styles.slider}
                                        min={0}
                                        max={max}
                                        value={uniform}
                                        onChange={(e) => setUniform(+e.target.value)}
                                    />
                                    <input
                                        className={styles.numberInput}
                                        type="number"
                                        min={0}
                                        value={uniform}
                                        onChange={(e) => setUniform(Math.max(0, +e.target.value))}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <span className={shell.label}>Corners</span>
                                <div className={styles.cornersGrid}>
                                    {CORNERS.map((c) => (
                                        <div key={c.key} className={styles.cornerCell}>
                                            <span className={styles.cornerLabel}>{c.label}</span>
                                            <div className={styles.row}>
                                                <input
                                                    className={styles.numberInput}
                                                    style={{ width: '100%', textAlign: 'left' }}
                                                    type="number"
                                                    min={0}
                                                    value={corners[c.key].h}
                                                    onChange={(e) => updateCorner(c.key, 'h', Math.max(0, +e.target.value))}
                                                />
                                                {mode === 'asymmetric' && (
                                                    <>
                                                        <span style={{ color: 'var(--clay-muted-soft)', fontSize: 11 }}>/</span>
                                                        <input
                                                            className={styles.numberInput}
                                                            style={{ width: '100%', textAlign: 'left' }}
                                                            type="number"
                                                            min={0}
                                                            value={corners[c.key].v}
                                                            onChange={(e) => updateCorner(c.key, 'v', Math.max(0, +e.target.value))}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <span className={shell.label}>Presets</span>
                            <div className={styles.shapeRow}>
                                {SHAPES.map((s) => (
                                    <button key={s.name} className={styles.shapeBtn} onClick={() => applyShape(s)}>
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <section className={shell.section}>
                    <span className={shell.label}>CSS output</span>
                    <pre className={styles.codeBlock}>{`border-radius: ${css};`}</pre>
                </section>
            </div>
        </div>
    );
}
