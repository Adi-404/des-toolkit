'use client';

import { useMemo, useState } from 'react';
import {
    contrastRatio, hexToRgb, rgbToHex, simulateColorBlind, colorBlindKinds,
    wcagLevel, type RGB,
} from '@/lib/color';
import shell from './ToolPage.module.css';
import styles from './Contrast.module.css';

const DEFAULT_FG = '#0a0a0a';
const DEFAULT_BG = '#fffaf0';

interface SwatchInputProps {
    label: string;
    value: string;
    onChange: (hex: string) => void;
}

function SwatchInput({ label, value, onChange }: SwatchInputProps) {
    const [text, setText] = useState(value);
    const [prevValue, setPrevValue] = useState(value);

    if (value !== prevValue) {
        setPrevValue(value);
        setText(value);
    }

    function commit(raw: string) {
        const v = raw.trim().startsWith('#') ? raw.trim() : '#' + raw.trim();
        const parsed = hexToRgb(v);
        if (parsed) onChange(rgbToHex(parsed));
        else setText(value);
    }

    return (
        <div className={styles.field}>
            <span className={shell.label}>{label}</span>
            <div className={styles.fieldRow}>
                <input
                    type="color"
                    className={styles.swatch}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    aria-label={`${label} colour picker`}
                />
                <input
                    type="text"
                    className={`${shell.input} ${shell.inputMono}`}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={() => commit(text)}
                    onKeyDown={(e) => e.key === 'Enter' && commit(text)}
                    spellCheck={false}
                    maxLength={7}
                />
            </div>
        </div>
    );
}

function Badge({ pass, label, hint }: { pass: boolean; label: string; hint?: string }) {
    return (
        <span className={`${styles.badge} ${pass ? styles.pass : styles.fail}`}>
            <span>{pass ? '✓' : '✕'}</span>
            <span>{label}</span>
            {hint ? <span style={{ opacity: 0.7 }}>· {hint}</span> : null}
        </span>
    );
}

export default function Contrast() {
    const [fg, setFg] = useState(DEFAULT_FG);
    const [bg, setBg] = useState(DEFAULT_BG);

    const fgRgb = useMemo<RGB>(() => hexToRgb(fg) ?? { r: 10, g: 10, b: 10 }, [fg]);
    const bgRgb = useMemo<RGB>(() => hexToRgb(bg) ?? { r: 255, g: 250, b: 240 }, [bg]);
    const ratio = useMemo(() => contrastRatio(fgRgb, bgRgb), [fgRgb, bgRgb]);

    const aaSmall = ratio >= 4.5;
    const aaaSmall = ratio >= 7;
    const aaLarge = ratio >= 3;
    const aaaLarge = ratio >= 4.5;

    const summary = wcagLevel(ratio, false);
    const summaryLabel =
        summary === 'aaa' ? 'AAA · perfect' :
        summary === 'aa' ? 'AA · good for body text' :
        ratio >= 3 ? 'Large text only' :
        'Insufficient';

    function swap() {
        setFg(bg);
        setBg(fg);
    }

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Color · accessibility</div>
                        <h1 className={shell.title}>Contrast.</h1>
                        <p className={shell.lede}>
                            Check WCAG 2.1 contrast ratios and preview how the pair lands for
                            people with different forms of colour-vision deficiency.
                        </p>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={shell.card}>
                        <div className={styles.controlCard}>
                            <SwatchInput label="Foreground" value={fg} onChange={setFg} />
                            <SwatchInput label="Background" value={bg} onChange={setBg} />
                            <button className={styles.swap} onClick={swap} aria-label="Swap colours">⇅</button>
                        </div>
                    </div>

                    <div className={styles.result}>
                        <div className={styles.previewBlock} style={{ background: bg, color: fg }}>
                            <div className={styles.previewLarge}>The quick brown fox</div>
                            <div className={styles.previewSmall}>
                                jumps over the lazy dog. Body copy at 16px / 1.55 — the size that has
                                to pass AA most often in real interfaces.
                            </div>
                        </div>
                        <div className={styles.ratioBar}>
                            <div>
                                <span className={styles.ratioNum}>{ratio.toFixed(2)}</span>
                                <span className={styles.ratioSuffix}>:1 · {summaryLabel}</span>
                            </div>
                            <div className={styles.badges}>
                                <Badge pass={aaSmall}  label="AA"  hint="text" />
                                <Badge pass={aaaSmall} label="AAA" hint="text" />
                                <Badge pass={aaLarge}  label="AA"  hint="large" />
                                <Badge pass={aaaLarge} label="AAA" hint="large" />
                            </div>
                        </div>
                    </div>
                </div>

                <section className={shell.section}>
                    <h2 className={shell.sectionTitle}>Colour-vision preview</h2>
                    <p className={shell.sectionSub}>
                        Simulated using Vischeck-style transformation matrices. Use as an indicator,
                        not a substitute for testing with real users.
                    </p>

                    <div className={styles.blindGrid}>
                        {colorBlindKinds.map(({ kind, label, pop }) => {
                            const fgSim = rgbToHex(simulateColorBlind(fgRgb, kind));
                            const bgSim = rgbToHex(simulateColorBlind(bgRgb, kind));
                            const simRatio = contrastRatio(
                                simulateColorBlind(fgRgb, kind),
                                simulateColorBlind(bgRgb, kind),
                            );
                            return (
                                <div key={kind} className={styles.blindCard}>
                                    <div className={styles.blindHeader}>
                                        <div>
                                            <div className={styles.blindTitle}>{label}</div>
                                            <div className={styles.blindPop}>{pop}</div>
                                        </div>
                                        <span className={`${styles.badge} ${simRatio >= 4.5 ? styles.pass : simRatio >= 3 ? styles.partial : styles.fail}`}>
                                            {simRatio.toFixed(2)}:1
                                        </span>
                                    </div>
                                    <div className={styles.blindSwatchPair}>
                                        <div className={styles.blindSwatch} style={{ background: bgSim, color: fgSim }}>
                                            Body copy
                                        </div>
                                        <div className={styles.blindSwatch} style={{ background: fgSim, color: bgSim }}>
                                            Inverted
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
