'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    detectFormat, emitCss, emitJson, emitTailwind, parse, type TokenFormat,
} from '@/lib/tokens';
import shell from './ToolPage.module.css';
import styles from './TokenTranslator.module.css';

const SAMPLES: Record<TokenFormat, string> = {
    css: `:root {
  --brand-pink: #ff4d8b;
  --brand-teal: #1a3a3a;
  --brand-lavender: #b8a4ed;
  --neutral-100: #fffaf0;
  --neutral-500: #6a6a6a;
  --neutral-900: #0a0a0a;
}`,
    tailwind: `module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#ff4d8b',
          teal: '#1a3a3a',
          lavender: '#b8a4ed',
        },
        neutral: {
          100: '#fffaf0',
          500: '#6a6a6a',
          900: '#0a0a0a',
        },
      },
    },
  },
};`,
    json: `{
  "color": {
    "brand": {
      "pink": { "$type": "color", "value": "#ff4d8b" },
      "teal": { "$type": "color", "value": "#1a3a3a" },
      "lavender": { "$type": "color", "value": "#b8a4ed" }
    },
    "neutral": {
      "100": { "$type": "color", "value": "#fffaf0" },
      "500": { "$type": "color", "value": "#6a6a6a" },
      "900": { "$type": "color", "value": "#0a0a0a" }
    }
  }
}`,
};

const FORMAT_LABEL: Record<TokenFormat, string> = {
    css: 'CSS variables',
    tailwind: 'Tailwind config',
    json: 'tokens.json (W3C)',
};

export default function TokenTranslator() {
    const [inputFormat, setInputFormat] = useState<TokenFormat>('css');
    const [outputFormat, setOutputFormat] = useState<TokenFormat>('tailwind');
    const [input, setInput] = useState(SAMPLES.css);
    const [autoFormat, setAutoFormat] = useState(true);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 1200);
        return () => clearTimeout(t);
    }, [toast]);

    const detected = useMemo(() => detectFormat(input), [input]);
    const effectiveFormat = autoFormat && detected ? detected : inputFormat;

    const tokens = useMemo(() => parse(input, effectiveFormat), [input, effectiveFormat]);

    const output = useMemo(() => {
        if (outputFormat === 'css') return emitCss(tokens);
        if (outputFormat === 'tailwind') return emitTailwind(tokens);
        return emitJson(tokens);
    }, [tokens, outputFormat]);

    function loadSample(f: TokenFormat) {
        setInput(SAMPLES[f]);
        setInputFormat(f);
        setAutoFormat(true);
    }

    async function copyOutput() {
        await navigator.clipboard.writeText(output);
        setToast(`Copied ${FORMAT_LABEL[outputFormat]}`);
    }

    const status = tokens.length > 0
        ? { text: `Parsed ${tokens.length} colour token${tokens.length === 1 ? '' : 's'}`, cls: styles.statusOk }
        : input.trim()
            ? { text: 'No colour tokens detected — check the input format.', cls: styles.statusWarn }
            : { text: 'Paste a CSS, Tailwind, or W3C JSON snippet to translate.', cls: styles.statusText };

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>Assets · tokens</div>
                        <h1 className={shell.title}>Token <span className="clay-title-script clay-title-script-teal">translator</span>.</h1>
                        <p className={shell.lede}>
                            Paste colour tokens in any format — CSS variables, Tailwind config,
                            or W3C tokens.json — and get the other two <span className="clay-highlight clay-highlight-teal">on the spot</span>.
                        </p>
                    </div>
                    <div className={shell.headerActions}>
                        <button className={shell.btnPrimary} onClick={copyOutput} disabled={tokens.length === 0}>
                            ⧉ Copy {FORMAT_LABEL[outputFormat]}
                        </button>
                    </div>
                </header>

                <div className={styles.statusRow}>
                    <span className={`${styles.statusText} ${status.cls}`}>{status.text}</span>
                    <div className={styles.swatchStrip}>
                        {tokens.slice(0, 16).map((t) => (
                            <span key={t.path} className={styles.swatch} style={{ background: t.hex }} title={`${t.path} · ${t.hex}`} />
                        ))}
                        {tokens.length > 16 && (
                            <span style={{ fontSize: 12, color: 'var(--clay-muted)', alignSelf: 'center' }}>
                                +{tokens.length - 16}
                            </span>
                        )}
                    </div>
                </div>

                <div className={styles.layout} style={{ marginTop: 'var(--clay-space-lg)' }}>
                    <div className={styles.column}>
                        <div className={styles.columnHead}>
                            <span className={styles.columnTitle}>
                                Input{autoFormat && detected ? ` · auto: ${FORMAT_LABEL[detected]}` : ''}
                            </span>
                            <div className={styles.formatToggle}>
                                {(Object.keys(SAMPLES) as TokenFormat[]).map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        className={`${styles.formatBtn} ${effectiveFormat === f ? styles.formatBtnActive : ''}`}
                                        onClick={() => { setInputFormat(f); setAutoFormat(false); }}
                                        title={FORMAT_LABEL[f]}
                                    >
                                        {f === 'css' ? 'CSS' : f === 'tailwind' ? 'Tailwind' : 'JSON'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            className={styles.editor}
                            value={input}
                            onChange={(e) => { setInput(e.target.value); setAutoFormat(true); }}
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="off"
                        />

                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            <button className={shell.btnSecondary} onClick={() => loadSample('css')}>Load CSS sample</button>
                            <button className={shell.btnSecondary} onClick={() => loadSample('tailwind')}>Load Tailwind sample</button>
                            <button className={shell.btnSecondary} onClick={() => loadSample('json')}>Load JSON sample</button>
                        </div>
                    </div>

                    <div className={styles.column}>
                        <div className={styles.columnHead}>
                            <span className={styles.columnTitle}>Output</span>
                            <div className={styles.formatToggle}>
                                {(Object.keys(SAMPLES) as TokenFormat[]).map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        className={`${styles.formatBtn} ${outputFormat === f ? styles.formatBtnActive : ''}`}
                                        onClick={() => setOutputFormat(f)}
                                    >
                                        {f === 'css' ? 'CSS' : f === 'tailwind' ? 'Tailwind' : 'JSON'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <pre className={styles.outputBlock}>{output}</pre>
                    </div>
                </div>

                {toast && <div className={styles.copyToast}>{toast}</div>}
            </div>
        </div>
    );
}
