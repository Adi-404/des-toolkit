'use client';

import { useCallback, useRef, useState } from 'react';
import styles from './ColorPalette.module.css';

// ── Color math ───────────────────────────────────────────────────────────────

type RGB = [number, number, number];

function distSq(a: RGB, b: RGB): number {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function toHex([r, g, b]: RGB): string {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function toHsl([r, g, b]: RGB): [number, number, number] {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = d / (l > 0.5 ? 2 - max - min : max + min);
    let h = 0;
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    return [h / 6, s, l];
}

/** k-means++ clustering. Returns centers sorted by cluster size (desc). */
function kMeans(pixels: RGB[], k: number, maxIter = 20): { rgb: RGB; count: number }[] {
    if (pixels.length === 0) return [];
    k = Math.min(k, pixels.length);

    // k-means++ initialisation — spread initial centers
    const centers: RGB[] = [pixels[Math.floor(Math.random() * pixels.length)]];
    while (centers.length < k) {
        const dists = pixels.map(p => Math.min(...centers.map(c => distSq(p, c))));
        const sum = dists.reduce((s, d) => s + d, 0);
        let r = Math.random() * sum;
        let chosen = pixels[pixels.length - 1];
        for (let i = 0; i < pixels.length; i++) { r -= dists[i]; if (r <= 0) { chosen = pixels[i]; break; } }
        centers.push(chosen);
    }

    const assignments = new Int32Array(pixels.length);
    for (let iter = 0; iter < maxIter; iter++) {
        let changed = false;
        for (let i = 0; i < pixels.length; i++) {
            let best = 0, bestD = Infinity;
            for (let j = 0; j < k; j++) { const d = distSq(pixels[i], centers[j]); if (d < bestD) { bestD = d; best = j; } }
            if (assignments[i] !== best) { assignments[i] = best; changed = true; }
        }
        if (!changed) break;
        const sums = Array.from({ length: k }, () => [0, 0, 0, 0]);
        for (let i = 0; i < pixels.length; i++) {
            const j = assignments[i];
            sums[j][0] += pixels[i][0]; sums[j][1] += pixels[i][1]; sums[j][2] += pixels[i][2]; sums[j][3]++;
        }
        for (let j = 0; j < k; j++) {
            if (!sums[j][3]) continue;
            centers[j] = [Math.round(sums[j][0] / sums[j][3]), Math.round(sums[j][1] / sums[j][3]), Math.round(sums[j][2] / sums[j][3])];
        }
    }

    const counts = new Array(k).fill(0);
    for (const a of assignments) counts[a]++;
    return centers.map((rgb, i) => ({ rgb, count: counts[i] })).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
}

function samplePixels(img: HTMLImageElement, maxPx = 12000): RGB[] {
    const scale = Math.min(1, Math.sqrt(maxPx / (img.naturalWidth * img.naturalHeight)));
    const w = Math.max(1, Math.floor(img.naturalWidth * scale));
    const h = Math.max(1, Math.floor(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const pixels: RGB[] = [];
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
    return pixels;
}

// ── Component ────────────────────────────────────────────────────────────────

interface PaletteEntry { hex: string; rgb: RGB; proportion: number; }

export default function ColorPalette() {
    const [imgSrc, setImgSrc] = useState<string | null>(null);
    const [palette, setPalette] = useState<PaletteEntry[]>([]);
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function extract(src: string) {
        setBusy(true);
        setPalette([]);
        const img = new Image();
        img.onload = () => {
            const pixels = samplePixels(img);
            const clusters = kMeans(pixels, 8);
            const total = clusters.reduce((s, c) => s + c.count, 0);
            // Sort by hue so the palette looks coherent
            const sorted = [...clusters].sort((a, b) => toHsl(a.rgb)[0] - toHsl(b.rgb)[0]);
            setPalette(sorted.map(c => ({ hex: toHex(c.rgb), rgb: c.rgb, proportion: c.count / total })));
            setBusy(false);
        };
        img.src = src;
    }

    function loadFile(file: File) {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => { const src = e.target?.result as string; setImgSrc(src); extract(src); };
        reader.readAsDataURL(file);
    }

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) loadFile(file);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function copy(text: string, key: string) {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(k => k === key ? null : k), 1600);
    }

    const cssVars = palette.map((c, i) => `--color-${i + 1}: ${c.hex};`).join('\n');
    const tailwindStr = `{\n${palette.map((c, i) => `  ${i + 1}: '${c.hex}',`).join('\n')}\n}`;
    const hexList = palette.map(c => c.hex).join(', ');

    const hasResult = palette.length > 0;

    return (
        <div className={styles.scroll}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.eyebrow}>Design tools · color</div>
                    <h1 className={styles.title}>Palette <span className="clay-title-script">extractor</span></h1>
                    <p className={styles.lede}>Drop any image to pull out its dominant color palette. <span className="clay-highlight clay-highlight-pink">All in your browser</span>.</p>
                </header>

                <div className={styles.workspace}>
                    {/* ── Drop zone ── */}
                    <div
                        className={`${styles.dropZone} ${dragOver ? styles.dropZoneOver : ''} ${imgSrc ? styles.dropZoneHasImage : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onDrop}
                        onClick={() => inputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
                        aria-label="Drop image to extract palette"
                    >
                        {imgSrc ? (
                            <img src={imgSrc} className={styles.preview} alt="Uploaded" />
                        ) : (
                            <div className={styles.dropPrompt}>
                                <span className={styles.dropGlyph}>◈</span>
                                <span className={styles.dropTitle}>Drop an image</span>
                                <span className={styles.dropSub}>or click to browse — PNG, JPG, WebP, GIF</span>
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }}
                        />
                    </div>

                    {/* ── Palette output ── */}
                    <div className={styles.palettePanel}>
                        {busy && (
                            <div className={styles.busyState}>
                                <span className={styles.spinner} />
                                <span>Extracting palette…</span>
                            </div>
                        )}

                        {hasResult && !busy && (
                            <>
                                {/* Proportion bar */}
                                <div className={styles.proportionBar}>
                                    {palette.map(c => (
                                        <div
                                            key={c.hex}
                                            className={styles.proportionSegment}
                                            style={{ background: c.hex, flex: c.proportion }}
                                            title={`${c.hex} · ${Math.round(c.proportion * 100)}%`}
                                        />
                                    ))}
                                </div>

                                {/* Swatches */}
                                <div className={styles.swatches}>
                                    {palette.map(c => (
                                        <button
                                            key={c.hex}
                                            className={styles.swatch}
                                            onClick={() => copy(c.hex, c.hex)}
                                            title={`Click to copy ${c.hex}`}
                                        >
                                            <span className={styles.swatchColor} style={{ background: c.hex }} />
                                            <span className={styles.swatchHex}>{c.hex}</span>
                                            <span className={styles.swatchPct}>{Math.round(c.proportion * 100)}%</span>
                                            {copied === c.hex && <span className={styles.swatchCopied}>✓</span>}
                                        </button>
                                    ))}
                                </div>

                                {/* Export row */}
                                <div className={styles.exportRow}>
                                    <span className={styles.exportLabel}>Copy as</span>
                                    <button className={styles.exportBtn} onClick={() => copy(hexList, 'list')}>
                                        {copied === 'list' ? '✓ Copied' : 'Hex list'}
                                    </button>
                                    <button className={styles.exportBtn} onClick={() => copy(cssVars, 'css')}>
                                        {copied === 'css' ? '✓ Copied' : 'CSS vars'}
                                    </button>
                                    <button className={styles.exportBtn} onClick={() => copy(tailwindStr, 'tw')}>
                                        {copied === 'tw' ? '✓ Copied' : 'Tailwind'}
                                    </button>
                                    <button
                                        className={styles.exportBtnSecondary}
                                        onClick={() => { setImgSrc(null); setPalette([]); }}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </>
                        )}

                        {!busy && !hasResult && !imgSrc && (
                            <div className={styles.emptyState}>
                                <p>Your palette will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
