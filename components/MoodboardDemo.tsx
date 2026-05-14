'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import styles from './MoodboardDemo.module.css';

/**
 * One continuous flow (~28s) showing the actual product loop, end-to-end:
 *
 *   ① Browser fades in, URL types itself, "+ Save" pulses, the icebear card
 *      blooms into the moodboard, tags cascade.
 *   ② Browser crossfades into the full bento — all 10 saved images bloom in
 *      mixed sizes, then the grid scrolls upward to telegraph "lots saved".
 *   ③ Bento crossfades into a fontbook preview — 4 font cards bloom.
 *   ④ Fontbook crossfades into the claymation hero and holds.
 *   ⑤ Reset and replay.
 *
 * The 10 .jpeg files live in /public. Their filenames contain spaces, #,
 * parens and emoji, so each URL is run through encodeURIComponent first.
 */

const URL_TEXT = 'string-tune.fiddle.digital';
const CYCLE_MS = 28000;

// Resolve a /public asset URL safely regardless of filename quirks.
const pub = (name: string) => '/' + encodeURIComponent(name);

// Deterministic seeded photos via Lorem Picsum — every seed returns the
// same image forever, no auth, no rate limit, no copyright risk. Used as
// the moodboard-feel filler around the user's actual saved screenshot.
const picsum = (seed: string, w = 480, h = 360) =>
    `https://picsum.photos/seed/${encodeURIComponent(seed)}/${w}/${h}`;

interface DemoTag { name: string; color: string; }
const TAGS: DemoTag[] = [
    { name: 'Inspiration', color: 'pink' },
    { name: 'Layouts',     color: 'lavender' },
    { name: 'Type',        color: 'peach' },
    { name: 'Color',       color: 'teal' },
];

const FONT_DEMOS = [
    { family: 'Playfair Display', sample: 'Headlines that breathe',     tag: 'Serif',   accent: '#ff4d8b' },
    { family: 'Space Grotesk',    sample: 'Geometric. Modern. Clean.',  tag: 'Sans',    accent: '#b8a4ed' },
    { family: 'Fraunces',         sample: 'Optical size & weight',      tag: 'Display', accent: '#ffb084' },
    { family: 'IBM Plex Mono',    sample: '01 code terminal clear',     tag: 'Mono',    accent: '#a4d4c5' },
];

// The user's saved screenshot — used both inside the browser save-flow AND
// as the anchor tile in the bento. Same URL keeps the visual continuity
// when the browser crossfades into the bento phase. Links to the live page
// it was captured from.
const SAVED_IMG = '/string-tune-screenshot.png';
const SAVED_TITLE = 'string-tune · interactive fiddle';
const SAVED_HOST = 'string-tune.fiddle.digital';

type TileSize = 'normal' | 'wide' | 'tall' | 'feature';
interface BentoTile {
    src: string;
    size: TileSize;
    alt: string;
}

// 10 tiles laid out in a 4-col bento — first the user's actual saved
// screenshot, then nine seeded Picsum photos for a moodboard-y mix of
// sizes. Two extra rows fall below the initial viewport so the scroll-up
// motion has somewhere to go.
const BENTO: BentoTile[] = [
    { src: SAVED_IMG,                  size: 'feature', alt: SAVED_TITLE },
    { src: picsum('warm-paper'),       size: 'normal',  alt: 'paper texture' },
    { src: picsum('layout-grid'),      size: 'normal',  alt: 'layout grid' },
    { src: picsum('editorial-spread'), size: 'wide',    alt: 'editorial spread' },
    { src: picsum('letterpress'),      size: 'normal',  alt: 'letterpress type' },
    { src: picsum('soft-light'),       size: 'wide',    alt: 'soft light reference' },
    { src: picsum('palette-cream'),    size: 'normal',  alt: 'cream palette' },
    { src: picsum('modular-system'),   size: 'wide',    alt: 'modular system' },
    { src: picsum('vertical-arch'),    size: 'tall',    alt: 'vertical architecture' },
    { src: picsum('field-notes'),      size: 'normal',  alt: 'field notes' },
];

export default function MoodboardDemo() {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), CYCLE_MS);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital@0;1&family=Space+Grotesk:wght@400;600&family=Fraunces:ital,opsz,wght@0,9..144,400;1,9..144,400&family=IBM+Plex+Mono:wght@400;600&display=swap';
        document.head.appendChild(link);
        return () => { if (document.head.contains(link)) document.head.removeChild(link); };
    }, []);

    return (
        <div className={styles.stage}>
            <div className={styles.backdrop} />
            <Frame key={tick} />
        </div>
    );
}

function Frame() {
    const [typed, setTyped] = useState(0);

    useEffect(() => {
        const start = Date.now();
        const TYPE_START = 500;
        const TYPE_END = 3300;
        const id = setInterval(() => {
            const elapsed = Date.now() - start;
            if (elapsed < TYPE_START) return;
            if (elapsed >= TYPE_END) {
                setTyped(URL_TEXT.length);
                clearInterval(id);
                return;
            }
            const ratio = (elapsed - TYPE_START) / (TYPE_END - TYPE_START);
            setTyped(Math.floor(ratio * URL_TEXT.length));
        }, 60);
        return () => clearInterval(id);
    }, []);

    return (
        <div className={styles.frame}>
            {/* ① Browser layer — fades in, holds, fades out around 7.5s */}
            <motion.div
                className={styles.layer}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                    duration: CYCLE_MS / 1000,
                    // 0–1s in, hold to 7s, out by 7.5s   [/28]
                    times: [0, 0.0357, 0.25, 0.2679],
                    ease: 'easeInOut',
                }}
            >
                <motion.div
                    className={styles.browser}
                    initial={{ y: 24, scale: 0.96 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
                >
                    <div className={styles.browserBar}>
                        <span className={styles.browserDot} style={{ background: '#ff5f57' }} />
                        <span className={styles.browserDot} style={{ background: '#ffbd2e' }} />
                        <span className={styles.browserDot} style={{ background: '#28c840' }} />
                        <span className={styles.browserUrl}>des/toolkit · /moodboard</span>
                    </div>

                    <div className={styles.browserBody}>
                        <div className={styles.pasteRow}>
                            <div className={styles.pasteField}>
                                <span>{URL_TEXT.slice(0, typed)}</span>
                                {typed < URL_TEXT.length && <span className={styles.pasteCaret} />}
                            </div>
                            <motion.span
                                className={styles.pasteBtn}
                                animate={{ scale: [1, 1, 1.06, 1] }}
                                transition={{ duration: 0.6, delay: 3.4, ease: [0.2, 0.7, 0.2, 1] }}
                            >
                                + Save
                            </motion.span>
                        </div>

                        {/* Saved card — the icebear from /public is now the
                            real "image which is saved". */}
                        <motion.div
                            className={styles.savedCard}
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.6, delay: 3.9, ease: [0.2, 0.7, 0.2, 1] }}
                        >
                            <div
                                className={styles.savedImg}
                                style={{ backgroundImage: `url("${SAVED_IMG}")` }}
                                role="img"
                                aria-label={SAVED_TITLE}
                            />
                            <div className={styles.savedBody}>
                                <span className={styles.savedTitle}>{SAVED_TITLE}</span>
                                <span className={styles.savedHost}>{SAVED_HOST}</span>
                                <motion.div
                                    className={styles.savedDots}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.4, delay: 6.0 }}
                                >
                                    <span className={styles.savedDot} style={{ background: 'var(--clay-brand-pink)' }} />
                                    <span className={styles.savedDot} style={{ background: 'var(--clay-brand-lavender)' }} />
                                </motion.div>
                            </div>
                        </motion.div>

                        <motion.div
                            className={styles.tagPills}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 5.4 }}
                        >
                            {TAGS.map((tag, i) => {
                                const isActive = i === 0 || i === 1;
                                return (
                                    <motion.span
                                        key={tag.name}
                                        data-color={tag.color}
                                        className={`${styles.tagPill} ${isActive ? styles.tagPillActive : ''}`}
                                        initial={{ opacity: 0, scale: 0.7 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            duration: 0.32,
                                            delay: 5.5 + i * 0.13,
                                            ease: [0.2, 0.7, 0.2, 1],
                                        }}
                                    >
                                        {!isActive && <span className={styles.tagPillDot} />}
                                        {tag.name}
                                    </motion.span>
                                );
                            })}
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>

            {/* ② Bento layer — fades in around 7s, scrolls 7.5s–13s, out by 13.5s */}
            <motion.div
                className={styles.bentoLayer}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{
                    duration: CYCLE_MS / 1000,
                    // 0–7s invisible, fade in by 7.5s, hold to 13s, out by 13.5s [/28]
                    times: [0, 0.25, 0.2679, 0.4643, 0.4821],
                    ease: 'easeInOut',
                }}
            >
                <div className={styles.bentoShell}>
                    <div className={styles.bentoHead}>
                        <span className={styles.bentoLabel}>moodboard</span>
                        <span className={styles.bentoCount}>
                            <span className={styles.bentoCountDot} /> 10 saved
                        </span>
                    </div>
                    <div className={styles.bentoViewport}>
                        {/* The grid translates upward gently over ~5s to suggest
                            scrolling through a much fuller board. Negative Y
                            ≈ -120px lifts the lower rows into view. */}
                        <motion.div
                            className={styles.bentoGrid}
                            initial={{ y: 0 }}
                            animate={{ y: [0, 0, -130] }}
                            transition={{
                                duration: 6.5,
                                delay: 8.0,
                                // hold at 0 for 1.5s while cards bloom in, then
                                // pan up to -130 over the remaining time.
                                times: [0, 0.231, 1],
                                ease: [0.4, 0.0, 0.2, 1],
                            }}
                        >
                            {BENTO.map((tile, i) => (
                                <motion.div
                                    key={i}
                                    className={`${styles.bentoTile} ${styles[`size-${tile.size}`]}`}
                                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{
                                        duration: 0.4,
                                        // First card (icebear) lands almost
                                        // immediately on phase entry to match
                                        // the saved card the user just saw.
                                        delay: 7.6 + i * 0.08,
                                        ease: [0.2, 0.7, 0.2, 1],
                                    }}
                                >
                                    <div
                                        className={styles.bentoImg}
                                        style={{ backgroundImage: `url("${tile.src}")` }}
                                        role="img"
                                        aria-label={tile.alt}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* ③ Fontbook layer */}
            <motion.div
                className={styles.fontbookOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{
                    duration: CYCLE_MS / 1000,
                    // fade in 13.5s, hold to 16s, out by 16.5s   [/28]
                    times: [0, 0.4821, 0.5, 0.5714, 0.5893],
                    ease: 'easeInOut',
                }}
            >
                <div className={styles.fontbookShell}>
                    <div className={styles.fontbookHead}>
                        <span className={styles.fontbookLabel}>fontbook</span>
                        <span className={styles.fontbookSub}>your type library</span>
                    </div>
                    <div className={styles.fontbookGrid}>
                        {FONT_DEMOS.map((f, i) => (
                            <motion.div
                                key={f.family}
                                className={styles.fontCard}
                                initial={{ opacity: 0, y: 14, scale: 0.94 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{
                                    duration: 0.45,
                                    delay: 13.9 + i * 0.13,
                                    ease: [0.2, 0.7, 0.2, 1],
                                }}
                            >
                                <div className={styles.fontCardAccent} style={{ background: f.accent }} />
                                <div className={styles.fontCardBody}>
                                    <span
                                        className={styles.fontCardName}
                                        style={{ fontFamily: `'${f.family}', serif` }}
                                    >
                                        {f.family}
                                    </span>
                                    <span
                                        className={styles.fontCardSample}
                                        style={{ fontFamily: `'${f.family}', serif` }}
                                    >
                                        {f.sample}
                                    </span>
                                    <span className={styles.fontCardTag}>{f.tag}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ④ Claymation layer */}
            <motion.div
                className={styles.claymation}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1] }}
                transition={{
                    duration: CYCLE_MS / 1000,
                    // invisible 0–16s, fully opaque by 17s, holds to loop  [/28]
                    times: [0, 0.5714, 0.6071],
                    ease: 'easeInOut',
                }}
            >
                <div className={styles.claymationInner}>
                    <div className={styles.mountains}>
                        <motion.div
                            className={styles.sun}
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.9, delay: 17.0, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        <motion.div
                            className={`${styles.mountain} ${styles.m1}`}
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.7, delay: 17.2, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        <motion.div
                            className={`${styles.mountain} ${styles.m2}`}
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.7, delay: 17.35, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        <motion.div
                            className={`${styles.mountain} ${styles.m3}`}
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.7, delay: 17.5, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        <motion.div
                            className={styles.ground}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            style={{ transformOrigin: 'bottom' }}
                            transition={{ duration: 0.6, delay: 17.7, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                    </div>
                    <motion.span
                        className={styles.claymationLabel}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 18.1 }}
                    >
                        des/toolkit · save what you love
                    </motion.span>
                </div>
            </motion.div>
        </div>
    );
}
