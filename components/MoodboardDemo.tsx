'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import styles from './MoodboardDemo.module.css';

/**
 * One continuous 18-second flow:
 *   ① browser fades in, URL types itself, a saved card appears, tags cascade
 *   ② browser cross-fades into a fontbook preview — 4 font cards bloom in
 *   ③ fontbook cross-fades into the claymation hero, which holds ~5s
 *   ④ everything resets and replays
 */

const URL_TEXT = 'pinterest.com/pin/3729612269442333';
const CYCLE_MS = 18000;

interface DemoTag { name: string; color: string; }
const TAGS: DemoTag[] = [
    { name: 'Inspiration', color: 'pink' },
    { name: 'Layouts',     color: 'lavender' },
    { name: 'Type',        color: 'peach' },
    { name: 'Color',       color: 'teal' },
];

const FONT_DEMOS = [
    { family: 'Playfair Display', sample: 'Headlines that breathe', tag: 'Serif',   accent: '#ff4d8b' },
    { family: 'Space Grotesk',    sample: 'Geometric. Modern. Clean.', tag: 'Sans',  accent: '#b8a4ed' },
    { family: 'Fraunces',         sample: 'Optical size & weight',   tag: 'Display', accent: '#ffb084' },
    { family: 'IBM Plex Mono',    sample: '01 code terminal clear',  tag: 'Mono',    accent: '#a4d4c5' },
];

export default function MoodboardDemo() {
    const [tick, setTick] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), CYCLE_MS);
        return () => clearInterval(id);
    }, []);

    // Load Google Fonts for the fontbook demo phase
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

// ── A single cycle of the demo. Lives in its own component so its useState
//    resets cleanly when the parent remounts via tick.

function Frame() {
    const [typed, setTyped] = useState(0);

    // Typewriter — drives the URL field. Runs once per cycle and stops at
    // the URL's full length so the field stays steady through phases ②/③.
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
            {/* ① Browser layer — fades in, holds, fades out around 8.5s */}
            <motion.div
                className={styles.layer}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                    duration: CYCLE_MS / 1000,
                    // browser: 0–1s fade in, hold to 7s, fade out by 8.5s
                    times: [0, 0.0556, 0.3889, 0.4722],
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

                    {/* Saved card slides in around 4s */}
                    <motion.div
                        className={styles.savedCard}
                        initial={{ opacity: 0, y: 16, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.6, delay: 3.9, ease: [0.2, 0.7, 0.2, 1] }}
                    >
                        <div
                            className={styles.savedImg}
                            style={{ background: 'linear-gradient(135deg, #ff4d8b, #b8a4ed 60%, #ffb084)' }}
                        />
                        <div className={styles.savedBody}>
                            <span className={styles.savedTitle}>Editorial layouts that breathe</span>
                            <span className={styles.savedHost}>pinterest.com</span>
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

                    {/* Tags cascade in around 5.5s */}
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

            {/* ② fontbook layer — blooms in around 7s, fades out around 11s */}
            <motion.div
                className={styles.fontbookOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{
                    duration: CYCLE_MS / 1000,
                    // fontbook: invisible 0–7s, fade in by 8s, hold to 10s, fade out by 10.5s
                    times: [0, 0.3889, 0.4444, 0.5556, 0.5833],
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
                                    delay: 7.3 + i * 0.13,
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

            {/* ③ Claymation layer — fades in around 10.5s and holds */}
            <motion.div
                className={styles.claymation}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1] }}
                transition={{
                    duration: CYCLE_MS / 1000,
                    // claymation: invisible 0–10s, fully opaque by 11s, then
                    // holds at full opacity until the cycle resets at 18s.
                    // Mountains animate in *after* full opacity so colors
                    // never fight the cream backdrop during fade-in.
                    times: [0, 0.5556, 0.6111],
                    ease: 'easeInOut',
                }}
            >
                <div className={styles.claymationInner}>
                    <div className={styles.mountains}>
                        <motion.div
                            className={styles.sun}
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.9, delay: 11.0, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        <motion.div
                            className={`${styles.mountain} ${styles.m1}`}
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.7, delay: 11.2, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        <motion.div
                            className={`${styles.mountain} ${styles.m2}`}
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.7, delay: 11.35, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        <motion.div
                            className={`${styles.mountain} ${styles.m3}`}
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.7, delay: 11.5, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                        <motion.div
                            className={styles.ground}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            style={{ transformOrigin: 'bottom' }}
                            transition={{ duration: 0.6, delay: 11.7, ease: [0.2, 0.7, 0.2, 1] }}
                        />
                    </div>
                    <motion.span
                        className={styles.claymationLabel}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 12.1 }}
                    >
                        des/toolkit · save what you love
                    </motion.span>
                </div>
            </motion.div>
        </div>
    );
}
