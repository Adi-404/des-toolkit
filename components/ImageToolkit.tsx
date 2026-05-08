'use client';

import { useEffect, useRef, useState } from 'react';
import shell from './ToolPage.module.css';
import styles from './ImageToolkit.module.css';

interface ImageData {
    name: string;
    type: string;
    bytes: number;
    dataUrl: string;
    width: number;
    height: number;
}

const FAVICON_SIZES = [16, 32, 48, 64, 128, 192, 512];

function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageToolkit() {
    const [image, setImage] = useState<ImageData | null>(null);
    const [dragging, setDragging] = useState(false);
    const [favicons, setFavicons] = useState<{ size: number; url: string }[]>([]);
    const [toast, setToast] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 1200);
        return () => clearTimeout(t);
    }, [toast]);

    function loadFile(file: File) {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = String(reader.result ?? '');
            const img = new Image();
            img.onload = () => {
                setImage({
                    name: file.name,
                    type: file.type,
                    bytes: file.size,
                    dataUrl,
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });

                // Generate favicon raster set off the same source.
                const out: { size: number; url: string }[] = [];
                for (const size of FAVICON_SIZES) {
                    const canvas = document.createElement('canvas');
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) continue;
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    // Letterbox the source into a square at each target size.
                    const ratio = Math.min(size / img.naturalWidth, size / img.naturalHeight);
                    const w = img.naturalWidth * ratio;
                    const h = img.naturalHeight * ratio;
                    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
                    out.push({ size, url: canvas.toDataURL('image/png') });
                }
                setFavicons(out);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) loadFile(file);
    }

    async function copy(text: string, label: string) {
        await navigator.clipboard.writeText(text);
        setToast(`Copied ${label}`);
    }

    function download(url: string, name: string) {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    const linkSnippet = image ? FAVICON_SIZES.slice(0, 4).map((s) =>
        `<link rel="icon" type="image/png" sizes="${s}x${s}" href="/favicons/icon-${s}.png">`
    ).join('\n') + `\n<link rel="apple-touch-icon" sizes="180x180" href="/favicons/icon-192.png">` : '';

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Assets · image</div>
                        <h1 className={shell.title}>Image toolkit.</h1>
                        <p className={shell.lede}>
                            Drop an image to read its dimensions, copy it as a base64 data URL,
                            and generate a complete favicon set rendered straight off canvas.
                        </p>
                    </div>
                    {image && (
                        <div className={shell.headerActions}>
                            <button className={shell.btnSecondary} onClick={() => { setImage(null); setFavicons([]); }}>↺ Reset</button>
                        </div>
                    )}
                </header>

                {!image ? (
                    <div
                        className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
                        onClick={() => fileRef.current?.click()}
                        onDrop={onDrop}
                        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                        onDragLeave={() => setDragging(false)}
                    >
                        <span className={styles.dropIcon}>↑</span>
                        <span className={styles.dropTitle}>Drop or pick an image</span>
                        <span className={styles.dropHint}>PNG, JPG, GIF, WebP — up to ~10MB works smoothly</span>
                    </div>
                ) : (
                    <div className={styles.layout}>
                        <div className={styles.previewCol}>
                            <div className={styles.previewBox}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={image.dataUrl} alt={image.name} className={styles.previewImg} />
                            </div>

                            <div className={styles.statsList}>
                                <div className={styles.statRow}>
                                    <span className={styles.statKey}>File</span>
                                    <span className={styles.statVal} title={image.name}>{image.name}</span>
                                </div>
                                <div className={styles.statRow}>
                                    <span className={styles.statKey}>Type</span>
                                    <span className={styles.statVal}>{image.type}</span>
                                </div>
                                <div className={styles.statRow}>
                                    <span className={styles.statKey}>Size</span>
                                    <span className={styles.statVal}>{formatBytes(image.bytes)}</span>
                                </div>
                                <div className={styles.statRow}>
                                    <span className={styles.statKey}>Width</span>
                                    <span className={styles.statVal}>{image.width}px</span>
                                </div>
                                <div className={styles.statRow}>
                                    <span className={styles.statKey}>Height</span>
                                    <span className={styles.statVal}>{image.height}px</span>
                                </div>
                                <div className={styles.statRow}>
                                    <span className={styles.statKey}>Aspect</span>
                                    <span className={styles.statVal}>
                                        {(image.width / image.height).toFixed(3)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.outputs}>
                            <div className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <h2 className={styles.sectionTitle}>Base64 data URL</h2>
                                    <button className={shell.btnSecondary} onClick={() => copy(image.dataUrl, 'data URL')}>
                                        ⧉ Copy data URL
                                    </button>
                                </div>
                                <span className={styles.sectionSub}>Length · {image.dataUrl.length.toLocaleString()} chars</span>
                                <pre className={styles.codeBlock}>{image.dataUrl}</pre>
                            </div>

                            <div className={styles.section}>
                                <div className={styles.sectionHead}>
                                    <h2 className={styles.sectionTitle}>Favicon set</h2>
                                    <button className={shell.btnSecondary} onClick={() => copy(linkSnippet, 'HTML snippet')}>
                                        ⧉ Copy &lt;link&gt; tags
                                    </button>
                                </div>
                                <span className={styles.sectionSub}>Click any size to download the PNG.</span>
                                <div className={styles.faviconRow}>
                                    {favicons.map(({ size, url }) => (
                                        <button
                                            key={size}
                                            type="button"
                                            className={styles.faviconCell}
                                            onClick={() => download(url, `icon-${size}.png`)}
                                        >
                                            <div className={styles.faviconThumb}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={url} width={Math.min(size, 64)} height={Math.min(size, 64)} alt={`${size}px favicon`} />
                                            </div>
                                            <span className={styles.faviconMeta}>{size}×{size}</span>
                                        </button>
                                    ))}
                                </div>
                                <pre className={styles.codeBlock}>{linkSnippet}</pre>
                            </div>
                        </div>
                    </div>
                )}

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
                    style={{ display: 'none' }}
                />

                {toast && <div className={styles.copyToast}>{toast}</div>}
            </div>
        </div>
    );
}
