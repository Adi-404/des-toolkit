'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettingAction, setSettingAction } from '@/app/actions/settings';
import {
    hexToRgb, rgbToHex, formatRgb, formatHsl, formatHsb,
    readableOn, ramp, type RGB,
} from '@/lib/color';
import shell from './ToolPage.module.css';
import styles from './ColorPicker.module.css';

const DEFAULT_COLOR = '#3b82f6';

export default function ColorPicker() {
    const [color, setColor] = useState(DEFAULT_COLOR);
    const [hexInput, setHexInput] = useState(DEFAULT_COLOR);
    const [isDragging, setIsDragging] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        getSettingAction('color_value').then((c) => {
            if (c && /^#[0-9a-fA-F]{6}$/.test(c)) {
                setColor(c);
                setHexInput(c);
            }
            setLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (!loaded) return;
        setSettingAction('color_value', color);
    }, [color, loaded]);

    const sampleImageColor = useCallback((file: File) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const grid = 10;
            let totalR = 0, totalG = 0, totalB = 0, count = 0;
            for (let i = 0; i < grid; i++) {
                for (let j = 0; j < grid; j++) {
                    const x = Math.floor((i / grid) * img.width);
                    const y = Math.floor((j / grid) * img.height);
                    const px = ctx.getImageData(x, y, 1, 1).data;
                    totalR += px[0]; totalG += px[1]; totalB += px[2]; count++;
                }
            }
            const next = rgbToHex({
                r: Math.round(totalR / count),
                g: Math.round(totalG / count),
                b: Math.round(totalB / count),
            });
            setColor(next);
            setHexInput(next);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    }, []);

    useEffect(() => {
        function onPaste(e: ClipboardEvent) {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of Array.from(items)) {
                if (item.type.startsWith('image/')) {
                    const file = item.getAsFile();
                    if (file) sampleImageColor(file);
                    break;
                }
            }
        }
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [sampleImageColor]);

    const rgb: RGB = hexToRgb(color) ?? { r: 59, g: 130, b: 246 };
    const fg = readableOn(rgb);
    const fgCss = rgbToHex(fg);
    const ramp9 = ramp(rgb, 9);

    const outputs = [
        { key: 'hex', label: 'HEX', value: color },
        { key: 'rgb', label: 'RGB', value: formatRgb(rgb) },
        { key: 'hsl', label: 'HSL', value: formatHsl(rgb) },
        { key: 'hsb', label: 'HSB', value: formatHsb(rgb) },
    ];

    function applyColor(hex: string) {
        setColor(hex);
        setHexInput(hex);
    }

    function commitHex(raw: string) {
        const val = raw.trim().startsWith('#') ? raw.trim() : '#' + raw.trim();
        const parsed = hexToRgb(val);
        if (parsed) applyColor(rgbToHex(parsed));
        else setHexInput(color);
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
            sampleImageColor(file);
        }
    }

    async function copyValue(key: string, value: string) {
        await navigator.clipboard.writeText(value);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    }

    async function copyAll() {
        await navigator.clipboard.writeText(outputs.map((o) => `${o.label}: ${o.value}`).join('\n'));
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 1500);
    }

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Color · pick & convert</div>
                        <h1 className={shell.title}>Color picker.</h1>
                        <p className={shell.lede}>
                            Sample any colour, switch between HEX · RGB · HSL · HSB, and read off
                            a nine-step ramp from shade to tint.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnSecondary} onClick={() => applyColor(DEFAULT_COLOR)}>↺ Reset</button>
                        <button className={shell.btnPrimary} onClick={copyAll}>
                            {copiedAll ? '✓ Copied' : '⧉ Copy all formats'}
                        </button>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div
                        className={styles.preview}
                        style={{ background: color, color: fgCss }}
                    >
                        <div className={styles.previewMeta}>
                            <span className={styles.previewLabel}>Now</span>
                            <span className={styles.previewLabel}>{formatHsl(rgb)}</span>
                        </div>
                        <span className={styles.previewHex}>{color.toUpperCase()}</span>
                        <div className={styles.previewSwatchRow}>
                            {ramp9.slice(0, 4).map((s, i) => (
                                <div key={i} className={styles.previewSwatch} style={{ background: rgbToHex(s) }} />
                            ))}
                        </div>
                    </div>

                    <div className={styles.controls}>
                        <div className={styles.controlsRow}>
                            <input
                                type="color"
                                className={styles.colorInput}
                                value={color}
                                onChange={(e) => applyColor(e.target.value)}
                                aria-label="Open native color picker"
                            />
                            <input
                                type="text"
                                className={`${shell.input} ${shell.inputMono} ${styles.hexInput}`}
                                value={hexInput}
                                onChange={(e) => setHexInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commitHex(hexInput)}
                                onBlur={() => commitHex(hexInput)}
                                placeholder="#000000"
                                spellCheck={false}
                                maxLength={7}
                            />
                        </div>

                        <div
                            className={`${styles.dropZone} ${isDragging ? styles.dropZoneDragging : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={handleDrop}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                        >
                            <span className={styles.dropZoneIcon}>↑</span>
                            <span>Drop or paste an image to sample its average colour</span>
                            <span className={styles.dropZoneHint}>JPG · PNG</span>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) sampleImageColor(f); }}
                            style={{ display: 'none' }}
                        />
                        <canvas ref={canvasRef} style={{ display: 'none' }} />

                        <div className={styles.outputs}>
                            {outputs.map(({ key, label, value }) => (
                                <div key={key} className={styles.outputRow}>
                                    <span className={styles.outputLabel}>{label}</span>
                                    <span className={styles.outputValue}>{value}</span>
                                    <button
                                        className={`${styles.copyBtn} ${copiedKey === key ? styles.copied : ''}`}
                                        onClick={() => copyValue(key, value)}
                                        aria-label={`Copy ${label}`}
                                    >
                                        {copiedKey === key ? '✓' : '⧉'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <section className={shell.section}>
                    <div className={styles.rampLabel}>Nine-step ramp</div>
                    <div className={styles.ramp}>
                        {ramp9.map((stop, i) => {
                            const hex = rgbToHex(stop);
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className={styles.rampStop}
                                    style={{ background: hex, color: rgbToHex(readableOn(stop)) }}
                                    onClick={() => applyColor(hex)}
                                    title={`Set to ${hex.toUpperCase()}`}
                                >
                                    <span className={styles.rampStopLabel}>{hex.toUpperCase()}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
