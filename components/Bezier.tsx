'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import shell from './ToolPage.module.css';
import styles from './Bezier.module.css';

interface Point { x: number; y: number; }

const DEFAULT_P1: Point = { x: 0.42, y: 0 };
const DEFAULT_P2: Point = { x: 0.58, y: 1 };

const PRESETS = [
    { name: 'ease',         p1: { x: 0.25, y: 0.1 },  p2: { x: 0.25, y: 1.0 } },
    { name: 'ease-in',      p1: { x: 0.42, y: 0   },  p2: { x: 1.0,  y: 1.0 } },
    { name: 'ease-out',     p1: { x: 0,    y: 0   },  p2: { x: 0.58, y: 1.0 } },
    { name: 'ease-in-out',  p1: { x: 0.42, y: 0   },  p2: { x: 0.58, y: 1.0 } },
    { name: 'snappy',       p1: { x: 0.4,  y: 0   },  p2: { x: 0.2,  y: 1.0 } },
    { name: 'spring back',  p1: { x: 0.7,  y: -0.4 }, p2: { x: 0.4,  y: 1.4 } },
];

const SVG_SIZE = 320;
const PAD = 32; // padding inside the SVG so handles don't clip

function clampInput(n: number): number {
    return Math.max(-1.5, Math.min(1.5, n));
}

function pointToSvg(p: Point): { sx: number; sy: number } {
    // x ranges 0..1 horizontally; y is inverted (0 at bottom).
    // Allow y outside 0..1 for overshoot (clamped to -0.5..1.5 visually).
    const sx = PAD + p.x * (SVG_SIZE - PAD * 2);
    const sy = PAD + (1 - p.y) * (SVG_SIZE - PAD * 2);
    return { sx, sy };
}

function svgToPoint(sx: number, sy: number, lockX: boolean): Point {
    const x = (sx - PAD) / (SVG_SIZE - PAD * 2);
    const y = 1 - (sy - PAD) / (SVG_SIZE - PAD * 2);
    return {
        x: lockX ? Math.max(0, Math.min(1, x)) : x,
        y,
    };
}

/** Cubic-bezier eval: y at given t for control points (0,0)→p1→p2→(1,1). */
function cubicY(t: number, p1y: number, p2y: number): number {
    const u = 1 - t;
    return 3 * u * u * t * p1y + 3 * u * t * t * p2y + t * t * t;
}

/** Solve for t given x — Newton-Raphson, fall back to bisection. */
function tForX(x: number, p1x: number, p2x: number): number {
    const target = Math.max(0, Math.min(1, x));
    let t = target;
    for (let i = 0; i < 8; i++) {
        const u = 1 - t;
        const f = 3 * u * u * t * p1x + 3 * u * t * t * p2x + t * t * t - target;
        const df = 3 * u * u * p1x + 6 * u * t * (p2x - p1x) + 3 * t * t * (1 - p2x);
        if (Math.abs(f) < 1e-5 || df === 0) break;
        t = Math.max(0, Math.min(1, t - f / df));
    }
    return t;
}

export default function Bezier() {
    const [p1, setP1] = useState<Point>(DEFAULT_P1);
    const [p2, setP2] = useState<Point>(DEFAULT_P2);
    const [duration, setDuration] = useState(800);
    const [progress, setProgress] = useState(0); // 0..1
    const [playing, setPlaying] = useState(true);
    const [copied, setCopied] = useState(false);
    const svgRef = useRef<SVGSVGElement>(null);
    const dragRef = useRef<'p1' | 'p2' | null>(null);
    const startTimeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);

    const cssValue = useMemo(
        () => `cubic-bezier(${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)}, ${p2.y.toFixed(2)})`,
        [p1, p2],
    );

    // Animation loop drives progress (0..1) at given duration. Loops.
    useEffect(() => {
        if (!playing) return;
        let running = true;
        function tick(now: number) {
            if (!running) return;
            if (startTimeRef.current === null) startTimeRef.current = now;
            const elapsed = (now - startTimeRef.current) / duration;
            const t = elapsed % 1;
            setProgress(t);
            rafRef.current = requestAnimationFrame(tick);
        }
        rafRef.current = requestAnimationFrame(tick);
        return () => {
            running = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            startTimeRef.current = null;
        };
    }, [playing, duration]);

    // Map linear progress through the bezier curve to get eased displacement.
    const eased = useMemo(() => {
        const t = tForX(progress, p1.x, p2.x);
        return cubicY(t, p1.y, p2.y);
    }, [progress, p1, p2]);

    // ── Drag handling ──

    function startDrag(which: 'p1' | 'p2') {
        return (e: React.PointerEvent<SVGCircleElement>) => {
            (e.target as SVGCircleElement).setPointerCapture(e.pointerId);
            dragRef.current = which;
        };
    }

    function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
        if (!dragRef.current || !svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const sx = ((e.clientX - rect.left) / rect.width) * SVG_SIZE;
        const sy = ((e.clientY - rect.top) / rect.height) * SVG_SIZE;
        const next = svgToPoint(sx, sy, true);
        if (dragRef.current === 'p1') setP1(next);
        else setP2(next);
    }

    function endDrag() {
        dragRef.current = null;
    }

    function applyPreset(p: typeof PRESETS[number]) {
        setP1(p.p1);
        setP2(p.p2);
    }

    function commitNum(setter: (n: number) => void, axis: 'x' | 'y', current: Point, raw: string) {
        const n = parseFloat(raw);
        if (Number.isNaN(n)) return;
        if (axis === 'x') setter(Math.max(0, Math.min(1, n)));
        else setter(clampInput(n));
        // The setter writes to a single field — we need a higher-level updater here
        // but since we always pass the right setter from the caller, we don't need 'current' beyond clarity.
        void current;
    }

    function setP1Field(axis: 'x' | 'y', n: number) {
        setP1((cur) => ({ ...cur, [axis]: axis === 'x' ? Math.max(0, Math.min(1, n)) : clampInput(n) }));
    }

    function setP2Field(axis: 'x' | 'y', n: number) {
        setP2((cur) => ({ ...cur, [axis]: axis === 'x' ? Math.max(0, Math.min(1, n)) : clampInput(n) }));
    }

    async function copyCss() {
        await navigator.clipboard.writeText(`transition-timing-function: ${cssValue};`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    // ── Curve geometry ──

    const { sx: p1sx, sy: p1sy } = pointToSvg(p1);
    const { sx: p2sx, sy: p2sy } = pointToSvg(p2);
    const startSvg = pointToSvg({ x: 0, y: 0 });
    const endSvg = pointToSvg({ x: 1, y: 1 });
    const curvePath = `M ${startSvg.sx} ${startSvg.sy} C ${p1sx} ${p1sy}, ${p2sx} ${p2sy}, ${endSvg.sx} ${endSvg.sy}`;

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>CSS · easing</div>
                        <h1 className={shell.title}>Cubic-bezier studio.</h1>
                        <p className={shell.lede}>
                            Drag the two control handles to design an easing curve, watch a sample
                            element animate to it in real time, and copy the CSS.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnPrimary} onClick={copyCss}>
                            {copied ? '✓ Copied' : '⧉ Copy CSS'}
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div>
                        <div className={styles.editor}>
                            <svg
                                ref={svgRef}
                                className={styles.svg}
                                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                                onPointerMove={onPointerMove}
                                onPointerUp={endDrag}
                                onPointerLeave={endDrag}
                            >
                                {/* Grid */}
                                {[0.25, 0.5, 0.75].map((g) => {
                                    const off = PAD + g * (SVG_SIZE - PAD * 2);
                                    return (
                                        <g key={g}>
                                            <line x1={PAD} y1={off} x2={SVG_SIZE - PAD} y2={off} className={styles.gridLine} />
                                            <line x1={off} y1={PAD} x2={off} y2={SVG_SIZE - PAD} className={styles.gridLine} />
                                        </g>
                                    );
                                })}
                                {/* Axes */}
                                <line x1={PAD} y1={SVG_SIZE - PAD} x2={SVG_SIZE - PAD} y2={SVG_SIZE - PAD} className={styles.axis} />
                                <line x1={PAD} y1={PAD} x2={PAD} y2={SVG_SIZE - PAD} className={styles.axis} />
                                {/* Control lines */}
                                <line x1={startSvg.sx} y1={startSvg.sy} x2={p1sx} y2={p1sy} className={styles.controlLine} />
                                <line x1={endSvg.sx} y1={endSvg.sy} x2={p2sx} y2={p2sy} className={styles.controlLine} />
                                {/* Curve */}
                                <path d={curvePath} className={styles.curve} />
                                {/* Endpoints */}
                                <circle cx={startSvg.sx} cy={startSvg.sy} r={4} className={styles.endpoint} />
                                <circle cx={endSvg.sx} cy={endSvg.sy} r={4} className={styles.endpoint} />
                                {/* Handles */}
                                <circle
                                    cx={p1sx} cy={p1sy} r={9}
                                    className={`${styles.handle} ${styles.handleP1}`}
                                    onPointerDown={startDrag('p1')}
                                />
                                <circle
                                    cx={p2sx} cy={p2sy} r={9}
                                    className={`${styles.handle} ${styles.handleP2}`}
                                    onPointerDown={startDrag('p2')}
                                />
                            </svg>
                        </div>

                        <div className={styles.motion}>
                            <span className={shell.label}>Motion preview</span>
                            <div className={styles.motionTrack}>
                                <div
                                    className={styles.motionDot}
                                    style={{ transform: `translate(calc(${eased * 100}% * (1 - 36px / 100%) - ${eased * 36}px), -50%)` }}
                                />
                            </div>
                            <div className={styles.motionMeta}>
                                <button className={styles.coordInput} style={{ width: 64, cursor: 'pointer' }} onClick={() => setPlaying((p) => !p)}>
                                    {playing ? '❚❚' : '▶'}
                                </button>
                                <input
                                    type="range"
                                    className={styles.motionMetaSlider}
                                    min={200}
                                    max={3000}
                                    step={50}
                                    value={duration}
                                    onChange={(e) => setDuration(+e.target.value)}
                                />
                                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{duration}ms</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <div>
                            <span className={shell.label}>Control points</span>
                            <div className={styles.coordsRow}>
                                <div className={styles.coordCell}>
                                    <span className={styles.coordLabel}>P1 (pink)</span>
                                    <div className={styles.coordRow}>
                                        <input
                                            className={styles.coordInput}
                                            type="number"
                                            step={0.01}
                                            value={p1.x.toFixed(2)}
                                            onChange={(e) => commitNum((n) => setP1Field('x', n), 'x', p1, e.target.value)}
                                        />
                                        <input
                                            className={styles.coordInput}
                                            type="number"
                                            step={0.01}
                                            value={p1.y.toFixed(2)}
                                            onChange={(e) => commitNum((n) => setP1Field('y', n), 'y', p1, e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className={styles.coordCell}>
                                    <span className={styles.coordLabel}>P2 (teal)</span>
                                    <div className={styles.coordRow}>
                                        <input
                                            className={styles.coordInput}
                                            type="number"
                                            step={0.01}
                                            value={p2.x.toFixed(2)}
                                            onChange={(e) => commitNum((n) => setP2Field('x', n), 'x', p2, e.target.value)}
                                        />
                                        <input
                                            className={styles.coordInput}
                                            type="number"
                                            step={0.01}
                                            value={p2.y.toFixed(2)}
                                            onChange={(e) => commitNum((n) => setP2Field('y', n), 'y', p2, e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <span className={shell.label}>Presets</span>
                            <div className={styles.presetGrid}>
                                {PRESETS.map((p) => (
                                    <button key={p.name} className={styles.presetBtn} onClick={() => applyPreset(p)}>
                                        {p.name}
                                        <span className={styles.presetCoords}>
                                            ({p.p1.x}, {p.p1.y}, {p.p2.x}, {p.p2.y})
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <section className={shell.section}>
                    <span className={shell.label}>CSS output</span>
                    <pre className={styles.codeBlock}>{`transition-timing-function: ${cssValue};`}</pre>
                </section>
            </div>
        </div>
    );
}
