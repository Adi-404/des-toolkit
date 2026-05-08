'use client';

import { useMemo, useState } from 'react';
import { hexToRgb, rgbToHex } from '@/lib/color';
import shell from './ToolPage.module.css';
import styles from './Gradient.module.css';

type GradientType = 'linear' | 'radial' | 'conic';

interface Stop {
    id: number;
    hex: string;
    pos: number; // 0..100
}

const TYPES: { value: GradientType; label: string }[] = [
    { value: 'linear', label: 'Linear' },
    { value: 'radial', label: 'Radial' },
    { value: 'conic',  label: 'Conic' },
];

let stopId = 0;
const newStop = (hex: string, pos: number): Stop => ({ id: ++stopId, hex, pos });

export default function Gradient() {
    const [type, setType] = useState<GradientType>('linear');
    const [angle, setAngle] = useState(135);
    const [stops, setStops] = useState<Stop[]>([
        newStop('#ff4d8b', 0),
        newStop('#b8a4ed', 100),
    ]);
    const [copied, setCopied] = useState(false);

    const sorted = useMemo(() => [...stops].sort((a, b) => a.pos - b.pos), [stops]);

    const gradient = useMemo(() => {
        const stopList = sorted.map((s) => `${s.hex} ${Math.round(s.pos)}%`).join(', ');
        if (type === 'linear') return `linear-gradient(${angle}deg, ${stopList})`;
        if (type === 'radial') return `radial-gradient(circle at center, ${stopList})`;
        return `conic-gradient(from ${angle}deg at 50% 50%, ${stopList})`;
    }, [type, angle, sorted]);

    function updateStop(id: number, patch: Partial<Stop>) {
        setStops((cur) => cur.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    }

    function commitHex(id: number, raw: string, fallback: string) {
        const v = raw.trim().startsWith('#') ? raw.trim() : '#' + raw.trim();
        const parsed = hexToRgb(v);
        updateStop(id, { hex: parsed ? rgbToHex(parsed) : fallback });
    }

    function addStop() {
        if (stops.length >= 6) return;
        const positions = sorted.map((s) => s.pos);
        const gaps = positions.slice(0, -1).map((p, i) => ({ mid: (p + positions[i + 1]) / 2, span: positions[i + 1] - p }));
        const widest = gaps.length ? gaps.reduce((a, b) => (a.span > b.span ? a : b)) : { mid: 50, span: 100 };
        const a = sorted.find((s) => s.pos <= widest.mid) ?? sorted[0];
        const b = sorted.find((s) => s.pos > widest.mid) ?? sorted[sorted.length - 1];
        const aRgb = hexToRgb(a.hex)!;
        const bRgb = hexToRgb(b.hex)!;
        const t = (widest.mid - a.pos) / Math.max(1, b.pos - a.pos);
        const mid = rgbToHex({
            r: Math.round(aRgb.r + (bRgb.r - aRgb.r) * t),
            g: Math.round(aRgb.g + (bRgb.g - aRgb.g) * t),
            b: Math.round(aRgb.b + (bRgb.b - aRgb.b) * t),
        });
        setStops((cur) => [...cur, newStop(mid, widest.mid)]);
    }

    function removeStop(id: number) {
        if (stops.length <= 2) return;
        setStops((cur) => cur.filter((s) => s.id !== id));
    }

    async function copyCss() {
        await navigator.clipboard.writeText(`background: ${gradient};`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Color · gradient</div>
                        <h1 className={shell.title}>Gradient lab.</h1>
                        <p className={shell.lede}>
                            Compose linear, radial, or conic gradients with up to six stops, watch
                            them render live, and copy the CSS in one click.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnPrimary} onClick={copyCss}>
                            {copied ? '✓ Copied' : '⧉ Copy CSS'}
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={styles.preview} style={{ background: gradient }}>
                        <span className={styles.previewLabel}>{type} · {sorted.length} stops</span>
                    </div>

                    <div className={styles.controls}>
                        <div>
                            <span className={shell.label}>Type</span>
                            <div className={styles.typeRow}>
                                {TYPES.map((t) => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        className={`${styles.typeBtn} ${type === t.value ? styles.typeBtnActive : ''}`}
                                        onClick={() => setType(t.value)}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {type !== 'radial' && (
                            <div>
                                <span className={shell.label}>{type === 'conic' ? 'Start' : 'Angle'}</span>
                                <div className={styles.angleRow}>
                                    <input
                                        type="range"
                                        min={0}
                                        max={360}
                                        step={1}
                                        value={angle}
                                        onChange={(e) => setAngle(+e.target.value)}
                                        className={styles.slider}
                                    />
                                    <span className={styles.angleValue}>{angle}°</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <span className={shell.label}>Stops · {stops.length}/6</span>
                            <div className={styles.stops}>
                                {sorted.map((s) => (
                                    <div key={s.id} className={styles.stopRow}>
                                        <input
                                            type="color"
                                            className={styles.stopColor}
                                            value={s.hex}
                                            onChange={(e) => updateStop(s.id, { hex: e.target.value })}
                                            aria-label="Stop colour"
                                        />
                                        <input
                                            className={styles.stopHex}
                                            value={s.hex.toUpperCase()}
                                            onChange={(e) => updateStop(s.id, { hex: e.target.value })}
                                            onBlur={(e) => commitHex(s.id, e.target.value, '#000000')}
                                            spellCheck={false}
                                            maxLength={7}
                                        />
                                        <input
                                            className={styles.stopPos}
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={Math.round(s.pos)}
                                            onChange={(e) => updateStop(s.id, { pos: Math.max(0, Math.min(100, +e.target.value)) })}
                                            aria-label="Position"
                                        />
                                        <span style={{ color: 'var(--clay-muted-soft)', fontSize: 11 }}>%</span>
                                        <button
                                            type="button"
                                            className={styles.stopRemove}
                                            onClick={() => removeStop(s.id)}
                                            disabled={stops.length <= 2}
                                            aria-label="Remove stop"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                className={shell.btnSecondary}
                                onClick={addStop}
                                disabled={stops.length >= 6}
                                style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                            >
                                + Add stop
                            </button>
                        </div>
                    </div>
                </div>

                <section className={shell.section}>
                    <span className={shell.label}>CSS output</span>
                    <pre className={styles.codeBlock}>{`background: ${gradient};`}</pre>
                </section>
            </div>
        </div>
    );
}
