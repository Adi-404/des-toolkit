'use client';

import { useMemo, useRef, useState } from 'react';
import { isLikelySvg, optimizeSvg, parseSvgInfo } from '@/lib/svg';
import shell from './ToolPage.module.css';
import styles from './SvgViewer.module.css';

const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ff4d8b"/>
      <stop offset="100%" stop-color="#b8a4ed"/>
    </linearGradient>
  </defs>
  <rect width="120" height="120" rx="24" fill="url(#g)"/>
  <circle cx="60" cy="60" r="28" fill="#fffaf0"/>
  <circle cx="60" cy="60" r="14" fill="#0a0a0a"/>
</svg>`;

export default function SvgViewer() {
    const [source, setSource] = useState(SAMPLE);
    const [optimized, setOptimized] = useState(false);
    const [dark, setDark] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [copied, setCopied] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const original = useMemo(() => parseSvgInfo(source), [source]);
    const cleaned = useMemo(() => optimizeSvg(source), [source]);
    const cleanedInfo = useMemo(() => parseSvgInfo(cleaned), [cleaned]);

    const display = optimized ? cleaned : source;
    const isSvg = isLikelySvg(display);

    function handleFile(file: File) {
        if (!file.type.includes('svg') && !file.name.endsWith('.svg')) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') setSource(reader.result);
        };
        reader.readAsText(file);
    }

    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }

    async function copy(text: string) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }

    const saving = original.bytes - cleanedInfo.bytes;
    const savingPct = original.bytes > 0 ? Math.round((saving / original.bytes) * 100) : 0;

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Assets · SVG</div>
                        <h1 className={shell.title}>SVG viewer.</h1>
                        <p className={shell.lede}>
                            Paste, drop, or pick an SVG. See it rendered against a transparent
                            checker, with <span className="clay-highlight clay-highlight-teal">light cleanup</span> that strips comments, metadata and editor
                            namespaces while rounding long decimals.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnSecondary} onClick={() => setSource(SAMPLE)}>↺ Sample</button>
                        <button className={shell.btnPrimary} onClick={() => copy(display)}>
                            {copied ? '✓ Copied' : '⧉ Copy ' + (optimized ? 'cleaned' : 'source')}
                        </button>
                    </div>
                </header>

                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Width</span>
                        <span className={styles.statValue}>
                            {original.width !== null ? `${original.width}` : original.viewBox?.split(' ')[2] ?? '—'}
                        </span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Height</span>
                        <span className={styles.statValue}>
                            {original.height !== null ? `${original.height}` : original.viewBox?.split(' ')[3] ?? '—'}
                        </span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Source</span>
                        <span className={styles.statValue}>{original.bytes} B</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Cleaned</span>
                        <span className={styles.statValue}>{cleanedInfo.bytes} B</span>
                        {saving > 0 && (
                            <span className={styles.statSaving}>−{saving} B · {savingPct}%</span>
                        )}
                    </div>
                </div>

                <div className={styles.layout} style={{ marginTop: 'var(--clay-space-lg)' }}>
                    <div className={styles.column}>
                        <div className={styles.columnHeader}>
                            <span className={styles.columnLabel}>Source</span>
                            <div className={styles.toggle}>
                                <button
                                    className={`${styles.toggleBtn} ${!optimized ? styles.toggleBtnActive : ''}`}
                                    onClick={() => setOptimized(false)}
                                >
                                    Original
                                </button>
                                <button
                                    className={`${styles.toggleBtn} ${optimized ? styles.toggleBtnActive : ''}`}
                                    onClick={() => setOptimized(true)}
                                >
                                    Cleaned
                                </button>
                            </div>
                        </div>

                        <textarea
                            className={styles.editor}
                            value={optimized ? cleaned : source}
                            onChange={(e) => { setOptimized(false); setSource(e.target.value); }}
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="off"
                        />

                        <div
                            className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''}`}
                            onClick={() => fileRef.current?.click()}
                            onDrop={onDrop}
                            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                            onDragLeave={() => setDragging(false)}
                        >
                            <span style={{ fontSize: 18 }}>↑</span>
                            <span>Drop or pick an .svg file</span>
                            <span style={{ marginLeft: 'auto', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>SVG</span>
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".svg,image/svg+xml"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className={styles.column}>
                        <div className={styles.columnHeader}>
                            <span className={styles.columnLabel}>Preview</span>
                            <div className={styles.toggle}>
                                <button
                                    className={`${styles.toggleBtn} ${!dark ? styles.toggleBtnActive : ''}`}
                                    onClick={() => setDark(false)}
                                >
                                    Light
                                </button>
                                <button
                                    className={`${styles.toggleBtn} ${dark ? styles.toggleBtnActive : ''}`}
                                    onClick={() => setDark(true)}
                                >
                                    Dark
                                </button>
                            </div>
                        </div>

                        <div className={`${styles.preview} ${dark ? styles.previewDark : ''}`}>
                            {isSvg ? (
                                <div
                                    className={styles.previewSvg}
                                    dangerouslySetInnerHTML={{ __html: display }}
                                />
                            ) : (
                                <span style={{ color: 'var(--clay-muted)', fontSize: 13 }}>
                                    Paste valid SVG markup to preview.
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
