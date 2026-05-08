'use client';

import { motion } from 'motion/react';
import styles from './MoodboardMarquee.module.css';

/**
 * Three columns of moodboard pins drifting at different rates. Used as the
 * marketing surface on /sign-up — visually rich, no narrative, just texture.
 */

interface Pin {
    title: string;
    site: string;
    gradient: string;
    size: 'sm' | 'md' | 'lg' | 'xl';
}

// Three curated columns. Sizes are mixed so the wall doesn't grid-stripe.
const COLUMN_A: Pin[] = [
    { title: 'Editorial type, tighter than tight',  site: 'dribbble.com',         gradient: 'linear-gradient(135deg, #1a3a3a 0%, #5e81ac 100%)',                size: 'lg' },
    { title: 'Cream + ochre product story',          site: 'pinterest.com',        gradient: 'linear-gradient(135deg, #ffb084 0%, #e8b94a 100%)',                size: 'md' },
    { title: 'Brutalist landing page set',           site: 'awwwards.com',         gradient: 'linear-gradient(135deg, #0a0a0a 0%, #3a3a3a 100%)',                size: 'sm' },
    { title: 'Saturated card grids',                 site: 'behance.net',          gradient: 'linear-gradient(135deg, #ff4d8b 0%, #ffb084 100%)',                size: 'xl' },
    { title: 'Notion clones get refined',            site: 'pinterest.com',        gradient: 'linear-gradient(135deg, #faf5e8 0%, #ebe6d6 100%)',                size: 'sm' },
    { title: 'Soft drop shadows, harder type',       site: 'mobbin.com',           gradient: 'linear-gradient(135deg, #b8a4ed 0%, #ff6b5a 100%)',                size: 'md' },
];

const COLUMN_B: Pin[] = [
    { title: 'Variable type at hero scale',          site: 'fonts.google.com',     gradient: 'linear-gradient(135deg, #b8a4ed 0%, #ff4d8b 100%)',                size: 'md' },
    { title: 'Pastel token sets',                    site: 'tokens.studio',        gradient: 'linear-gradient(135deg, #a4d4c5 0%, #88c0d0 100%)',                size: 'lg' },
    { title: 'Claymation, but for SaaS',             site: 'clay.com',             gradient: 'linear-gradient(135deg, #ffb084 0%, #ff4d8b 60%, #b8a4ed 100%)',   size: 'xl' },
    { title: 'iOS 18 colour-tag patterns',           site: 'pttrns.com',           gradient: 'linear-gradient(135deg, #6cb6ff 0%, #b8a4ed 100%)',                size: 'sm' },
    { title: 'Editorial layouts that breathe',       site: 'are.na',               gradient: 'linear-gradient(135deg, #fffaf0 0%, #ffb084 70%)',                 size: 'md' },
    { title: 'Bezier curves, by mood',               site: 'easings.net',          gradient: 'linear-gradient(135deg, #1a3a3a 0%, #ff4d8b 100%)',                size: 'md' },
];

const COLUMN_C: Pin[] = [
    { title: 'Spacing systems, drawn out',           site: 'utopia.fyi',           gradient: 'linear-gradient(135deg, #e8b94a 0%, #ff6b5a 100%)',                size: 'sm' },
    { title: 'Warm gradients are back',              site: 'sitebuilderreport.com',gradient: 'linear-gradient(135deg, #ff4d8b 0%, #ffb084 50%, #e8b94a 100%)',   size: 'lg' },
    { title: 'Onboarding wizards, refined',          site: 'mobbin.com',           gradient: 'linear-gradient(135deg, #4078f2 0%, #b8a4ed 100%)',                size: 'md' },
    { title: 'Charts that argue softly',             site: 'twitter.com',          gradient: 'linear-gradient(135deg, #1a3a3a 0%, #a4d4c5 100%)',                size: 'xl' },
    { title: 'Subscription card colourways',         site: 'cards.dev',            gradient: 'linear-gradient(135deg, #ffb084 0%, #b8a4ed 100%)',                size: 'sm' },
    { title: 'Editorial-meets-product',              site: 'figma.com',            gradient: 'linear-gradient(135deg, #f5f0e0 0%, #ff4d8b 100%)',                size: 'md' },
];

interface ColumnProps {
    pins: Pin[];
    duration: number;
    direction: 'up' | 'down';
    extraClass?: string;
}

function Column({ pins, duration, direction, extraClass }: ColumnProps) {
    // Duplicate the pins so the seamless loop at -50% lands exactly back on
    // the start of the second copy. Keeps the wall visually continuous.
    const looped = [...pins, ...pins];
    const animateY = direction === 'up' ? ['0%', '-50%'] : ['-50%', '0%'];

    return (
        <div className={`${styles.column} ${extraClass ?? ''}`}>
            <motion.div
                className={styles.columnInner}
                animate={{ y: animateY }}
                transition={{ duration, ease: 'linear', repeat: Infinity }}
            >
                {looped.map((pin, i) => (
                    <div
                        key={`${i}-${pin.title}`}
                        className={`${styles.pin} ${styles[`pin${pin.size.toUpperCase() as Uppercase<Pin['size']>}`]}`}
                    >
                        <div className={styles.pinImage} style={{ backgroundImage: pin.gradient }} />
                        <div className={styles.pinBody}>
                            <span className={styles.pinTitle}>{pin.title}</span>
                            <span className={styles.pinSite}>{pin.site}</span>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

const FLOATING_TAGS: { name: string; color: string; top: string; left: string; rotate: number }[] = [
    { name: 'Inspiration', color: 'var(--clay-brand-pink)',     top: '12%', left: '32%', rotate: -4 },
    { name: 'Components',  color: 'var(--clay-brand-teal)',     top: '48%', left: '6%',  rotate: 3 },
    { name: 'Type',        color: 'var(--clay-brand-peach)',    top: '70%', left: '54%', rotate: -2 },
    { name: 'Color',       color: 'var(--clay-brand-lavender)', top: '28%', left: '70%', rotate: 5 },
];

export default function MoodboardMarquee() {
    return (
        <div className={styles.stage}>
            <div className={styles.backdrop} />

            <div className={styles.columns}>
                <Column pins={COLUMN_A} duration={42} direction="up" />
                <Column pins={COLUMN_B} duration={50} direction="down" />
                <Column pins={COLUMN_C} duration={36} direction="up" extraClass={styles.col3} />
            </div>

            <div className={styles.fadeTop} />
            <div className={styles.fadeBottom} />

            <div className={styles.pitch}>
                <span className={styles.pitchEyebrow}>Inspiration · moodboard</span>
                <h2 className={styles.pitchTitle}>
                    A wall for the design references<br/>you keep coming back to.
                </h2>
            </div>

            {FLOATING_TAGS.map((tag, i) => (
                <motion.div
                    key={tag.name}
                    className={styles.tagFloat}
                    style={{
                        top: tag.top,
                        left: tag.left,
                        ['--tag-color' as string]: tag.color,
                    }}
                    initial={{ opacity: 0, scale: 0.7, rotate: tag.rotate }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: [0, -6, 0],
                    }}
                    transition={{
                        opacity: { duration: 0.6, delay: 0.3 + i * 0.15 },
                        scale: { duration: 0.6, delay: 0.3 + i * 0.15, ease: [0.2, 0.7, 0.2, 1] },
                        y: { duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 + i * 0.2 },
                    }}
                >
                    <span className={styles.tagFloatDot} />
                    {tag.name}
                </motion.div>
            ))}
        </div>
    );
}
