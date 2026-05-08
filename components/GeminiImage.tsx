'use client';

import { useState } from 'react';
import shell from './ToolPage.module.css';
import styles from './GeminiImage.module.css';

const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '9:16', '16:9'] as const;
type AspectRatio = (typeof ASPECT_RATIOS)[number];

const SUGGESTIONS = [
    'Cream-coloured 3D claymation mountains at sunset, warm peach sky, soft shadows.',
    'Isometric illustration of a developer workshop, pastel palette, clean linework.',
    'Abstract gradient mesh composition in pink, lavender and ochre — minimal, editorial.',
    'A small character mascot holding a clipboard, claymation style, warm lighting.',
];

interface Result {
    image: string;        // base64
    mimeType: string;
    model: string;
    aspectRatio: string;
    prompt: string;
}

interface ApiError {
    error: string;
    message: string;
}

export default function GeminiImage() {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<Result | null>(null);
    const [error, setError] = useState<ApiError | null>(null);
    const [copied, setCopied] = useState(false);

    async function generate() {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt.trim(), aspectRatio }),
            });
            const body = await res.json();

            if (!res.ok) {
                setError({ error: body.error ?? 'unknown', message: body.message ?? 'Request failed.' });
                return;
            }

            setResult({
                image: body.image,
                mimeType: body.mimeType,
                model: body.model,
                aspectRatio: body.aspectRatio,
                prompt: prompt.trim(),
            });
        } catch (err) {
            setError({
                error: 'network',
                message: err instanceof Error ? err.message : 'Network error.',
            });
        } finally {
            setLoading(false);
        }
    }

    function download() {
        if (!result) return;
        const a = document.createElement('a');
        a.href = `data:${result.mimeType};base64,${result.image}`;
        a.download = `gemini-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    async function copyDataUrl() {
        if (!result) return;
        await navigator.clipboard.writeText(`data:${result.mimeType};base64,${result.image}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    }

    const isMissingKey = error?.error === 'missing_key';
    const isAuth = error?.error === 'upstream_error' && error.message.toLowerCase().includes('api key');

    return (
        <div className={shell.scroll}>
            <div className={shell.container}>
                <header className={shell.header}>
                    <div>
                        <div className={shell.eyebrow}>AI · imagery</div>
                        <h1 className={shell.title}>Gemini imagery.</h1>
                        <p className={shell.lede}>
                            Generate placeholder art straight from a prompt using Google&rsquo;s Imagen
                            via the Gemini API. Image data stays local; only the prompt leaves your machine.
                        </p>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={shell.card}>
                        <div className={styles.controls}>
                            <div className={styles.field}>
                                <span className={shell.label}>Prompt</span>
                                <textarea
                                    className={styles.prompt}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="A warm cream-tinted illustration of…"
                                    spellCheck={false}
                                />
                            </div>

                            <div className={styles.field}>
                                <span className={shell.label}>Aspect</span>
                                <div className={styles.aspectRow}>
                                    {ASPECT_RATIOS.map((a) => (
                                        <button
                                            key={a}
                                            type="button"
                                            className={`${styles.aspectBtn} ${aspectRatio === a ? styles.aspectBtnActive : ''}`}
                                            onClick={() => setAspectRatio(a)}
                                        >
                                            {a}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                className={styles.generateBtn}
                                onClick={generate}
                                disabled={loading || !prompt.trim()}
                            >
                                {loading ? 'Generating…' : '✦ Generate image'}
                            </button>

                            <div className={styles.field}>
                                <span className={shell.label}>Try a prompt</span>
                                <div className={styles.suggestList}>
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            className={styles.suggestBtn}
                                            onClick={() => setPrompt(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.stage}>
                        {isMissingKey && (
                            <div className={`${styles.banner} ${styles.bannerWarn}`}>
                                <span className={styles.bannerIcon}>⚙</span>
                                <span>
                                    <strong>Set your API key.</strong> Add{' '}
                                    <code>GEMINI_API_KEY=…</code> to <code>.env.local</code> at the project
                                    root and restart <code>next dev</code>. The key never leaves your server.
                                    Get one at <em>aistudio.google.com</em>.
                                </span>
                            </div>
                        )}

                        {error && !isMissingKey && (
                            <div className={`${styles.banner} ${styles.bannerErr}`}>
                                <span className={styles.bannerIcon}>{isAuth ? '🔑' : '⚠'}</span>
                                <span>
                                    <strong>{isAuth ? 'Auth failed.' : 'Couldn’t generate.'}</strong>{' '}
                                    {error.message}
                                </span>
                            </div>
                        )}

                        {loading && (
                            <div className={`${styles.banner} ${styles.bannerLoading}`}>
                                <span className={styles.spinner} />
                                <span>Asking Imagen for an image — this typically takes 5–15 seconds.</span>
                            </div>
                        )}

                        <div className={styles.canvasWrap}>
                            {result ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={`data:${result.mimeType};base64,${result.image}`}
                                    alt={result.prompt}
                                    className={styles.image}
                                />
                            ) : (
                                <div className={styles.placeholder}>
                                    <span className={styles.placeholderTitle}>Nothing here yet.</span>
                                    Drop a prompt on the left, pick an aspect ratio, and hit Generate.
                                </div>
                            )}
                        </div>

                        {result && (
                            <div className={styles.actions}>
                                <span className={styles.meta}>
                                    {result.model} · {result.aspectRatio} · {result.mimeType}
                                </span>
                                <div className={styles.actionGroup}>
                                    <button className={shell.btnSecondary} onClick={copyDataUrl}>
                                        {copied ? '✓ Copied data URL' : '⧉ Copy data URL'}
                                    </button>
                                    <button className={shell.btnPrimary} onClick={download}>↓ Download PNG</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
