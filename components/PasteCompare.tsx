'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import shell from './ToolPage.module.css';
import styles from './PasteCompare.module.css';

type Layout = 'split' | 'stacked';

interface Viewport { name: string; label: string; width: number | null; }

const VIEWPORTS: Viewport[] = [
    { name: 'fluid',   label: 'Fluid',           width: null },
    { name: 'mobile',  label: 'Mobile · 380',    width: 380 },
    { name: 'sm',      label: 'Small · 640',     width: 640 },
    { name: 'md',      label: 'Medium · 768',    width: 768 },
    { name: 'lg',      label: 'Large · 1024',    width: 1024 },
];

const SAMPLE_LEFT = `<style>
  body { font-family: 'Inter', sans-serif; padding: 24px; background: #f8f8f8; color: #111; }
  .card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
  h1 { font-size: 24px; margin: 0 0 8px; }
  p  { margin: 0; color: #555; line-height: 1.55; }
</style>
<div class="card">
  <h1>Variant A</h1>
  <p>Soft drop shadow, default radius.</p>
</div>`;

const SAMPLE_RIGHT = `<style>
  body { font-family: 'Inter', sans-serif; padding: 24px; background: #fffaf0; color: #111; }
  .card { background: #fff; border: 1px solid #e5e5e5; border-radius: 16px; padding: 24px; }
  h1 { font-size: 24px; margin: 0 0 8px; letter-spacing: -0.4px; }
  p  { margin: 0; color: #6a6a6a; line-height: 1.55; }
</style>
<div class="card">
  <h1>Variant B</h1>
  <p>Hairline border, no shadow, tighter heading.</p>
</div>`;

function buildSrcDoc(html: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html}</body></html>`;
}

export default function PasteCompare() {
    const [left, setLeft] = useState(SAMPLE_LEFT);
    const [right, setRight] = useState(SAMPLE_RIGHT);
    const [layout, setLayout] = useState<Layout>('split');
    const [viewport, setViewport] = useState<Viewport>(VIEWPORTS[0]);
    const [syncScroll, setSyncScroll] = useState(false);

    const leftRef = useRef<HTMLIFrameElement>(null);
    const rightRef = useRef<HTMLIFrameElement>(null);
    const isSyncingRef = useRef(false);

    const leftDoc = useMemo(() => buildSrcDoc(left), [left]);
    const rightDoc = useMemo(() => buildSrcDoc(right), [right]);

    // Wire sync-scroll between iframes when both are loaded.
    useEffect(() => {
        if (!syncScroll) return;
        const lf = leftRef.current;
        const rf = rightRef.current;
        if (!lf || !rf) return;

        function bind(source: HTMLIFrameElement, target: HTMLIFrameElement) {
            const win = source.contentWindow;
            if (!win) return () => {};
            const handler = () => {
                if (isSyncingRef.current) return;
                isSyncingRef.current = true;
                try {
                    target.contentWindow?.scrollTo({ top: win.scrollY, left: win.scrollX, behavior: 'auto' });
                } catch { /* cross-origin guard, harmless for srcDoc */ }
                requestAnimationFrame(() => { isSyncingRef.current = false; });
            };
            win.addEventListener('scroll', handler);
            return () => win.removeEventListener('scroll', handler);
        }

        const offA = bind(lf, rf);
        const offB = bind(rf, lf);
        return () => { offA(); offB(); };
    }, [syncScroll, leftDoc, rightDoc]);

    function swap() {
        setLeft(right);
        setRight(left);
    }

    function reset() {
        setLeft(SAMPLE_LEFT);
        setRight(SAMPLE_RIGHT);
    }

    const frameStyle: React.CSSProperties = viewport.width
        ? { width: `${viewport.width}px`, maxWidth: '100%' }
        : { width: '100%' };

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Frontend · paste & compare</div>
                        <h1 className={shell.title}>Paste & compare.</h1>
                        <p className={shell.lede}>
                            Drop two HTML/CSS snippets into the panes and render each in its own
                            sandboxed iframe — perfect for <span className="clay-highlight clay-highlight-coral">variant reviews</span> and design QA.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnSecondary} onClick={swap}>⇄ Swap</button>
                        <button className={shell.btnSecondary} onClick={reset}>↺ Reset</button>
                    </div>
                </header>

                <div className={styles.toolbar}>
                    <div className={styles.toolbarGroup}>
                        <span className={shell.label} style={{ marginBottom: 0, marginRight: 8 }}>Layout</span>
                        <div className={styles.toggle}>
                            <button
                                className={`${styles.toggleBtn} ${layout === 'split' ? styles.toggleBtnActive : ''}`}
                                onClick={() => setLayout('split')}
                            >
                                Split
                            </button>
                            <button
                                className={`${styles.toggleBtn} ${layout === 'stacked' ? styles.toggleBtnActive : ''}`}
                                onClick={() => setLayout('stacked')}
                            >
                                Stacked
                            </button>
                        </div>
                    </div>

                    <div className={styles.toolbarGroup}>
                        <span className={shell.label} style={{ marginBottom: 0, marginRight: 8 }}>Viewport</span>
                        <select
                            className={styles.viewportSelect}
                            value={viewport.name}
                            onChange={(e) => setViewport(VIEWPORTS.find((v) => v.name === e.target.value) ?? VIEWPORTS[0])}
                        >
                            {VIEWPORTS.map((v) => (
                                <option key={v.name} value={v.name}>{v.label}</option>
                            ))}
                        </select>
                    </div>

                    <label className={styles.scrollSync}>
                        <input
                            type="checkbox"
                            checked={syncScroll}
                            onChange={(e) => setSyncScroll(e.target.checked)}
                        />
                        Sync scroll
                    </label>
                </div>

                <div className={layout === 'split' ? styles.split : styles.stacked}>
                    <div className={styles.pane}>
                        <div className={styles.paneHead}>
                            <span className={styles.paneLabel}>Left · A</span>
                            <div className={styles.paneActions}>
                                <button className={styles.paneBtn} onClick={() => navigator.clipboard.writeText(left)}>Copy</button>
                                <button className={styles.paneBtn} onClick={() => setLeft('')}>Clear</button>
                            </div>
                        </div>
                        <textarea
                            className={styles.editor}
                            value={left}
                            onChange={(e) => setLeft(e.target.value)}
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="off"
                            placeholder="<style>…</style>&#10;<div>HTML…</div>"
                        />
                        <div className={styles.previewBox} style={{ position: 'relative' }}>
                            <div className={styles.iframeFrame} style={frameStyle}>
                                <iframe
                                    ref={leftRef}
                                    title="Left preview"
                                    sandbox="allow-same-origin"
                                    srcDoc={leftDoc}
                                    className={styles.iframe}
                                    style={{ minHeight: 360 }}
                                />
                            </div>
                            {viewport.width && <span className={styles.viewportLabel}>{viewport.width}px</span>}
                        </div>
                    </div>

                    <div className={styles.pane}>
                        <div className={styles.paneHead}>
                            <span className={styles.paneLabel}>Right · B</span>
                            <div className={styles.paneActions}>
                                <button className={styles.paneBtn} onClick={() => navigator.clipboard.writeText(right)}>Copy</button>
                                <button className={styles.paneBtn} onClick={() => setRight('')}>Clear</button>
                            </div>
                        </div>
                        <textarea
                            className={styles.editor}
                            value={right}
                            onChange={(e) => setRight(e.target.value)}
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="off"
                            placeholder="<style>…</style>&#10;<div>HTML…</div>"
                        />
                        <div className={styles.previewBox} style={{ position: 'relative' }}>
                            <div className={styles.iframeFrame} style={frameStyle}>
                                <iframe
                                    ref={rightRef}
                                    title="Right preview"
                                    sandbox="allow-same-origin"
                                    srcDoc={rightDoc}
                                    className={styles.iframe}
                                    style={{ minHeight: 360 }}
                                />
                            </div>
                            {viewport.width && <span className={styles.viewportLabel}>{viewport.width}px</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
