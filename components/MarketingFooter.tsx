'use client';

import { useState } from 'react';
import Link from 'next/link';
import ShortcutScribble from './ShortcutScribble';
import styles from './MarketingFooter.module.css';

/**
 * Marketing footer for the home/landing surface. Three columns:
 *   Brand   — name, tagline, alpha stamp
 *   Product — top-level routes the user can pick up from
 *   Made by — GitHub identity + the "buy me a coffee" Easter egg
 *
 * The Easter egg never actually opens a tipping page; on click it swaps the
 * label to "just kidding — say hi on LinkedIn" and the same button becomes
 * a link to the maintainer's LinkedIn profile.
 */

const GITHUB_PROFILE = 'https://github.com/Adi-404';
const LINKEDIN_URL   = 'https://www.linkedin.com/in/adityanmahapatra/';

export default function MarketingFooter() {
    return (
        <footer className={styles.footer}>
            <div className={styles.columns}>
                <div className={styles.brandCol}>
                    <div className={styles.brand}>
                        des<span className={styles.brandSlash}>/</span>toolkit
                        <span className={styles.brandStamp}>alpha</span>
                    </div>
                    <p className={styles.tagline}>
                        A warm workshop for the <span className={styles.taglineScript}>moments between</span> the big tools.
                        Moodboards, type, dev utilities — all in one place, all yours.
                    </p>
                    <ShortcutScribble variant="footer">
                        <span>shortcuts —</span>
                    </ShortcutScribble>
                </div>

                <div className={styles.col}>
                    <h4 className={styles.colTitle}>Product</h4>
                    <ul className={styles.colList}>
                        <li><Link href="/moodboard"      className={styles.colLink}>Moodboard</Link></li>
                        <li><Link href="/fonts"          className={styles.colLink}>Fonts</Link></li>
                        <li><Link href="/color/contrast" className={styles.colLink}>Tools</Link></li>
                        <li><Link href="/settings"       className={styles.colLink}>Settings</Link></li>
                    </ul>
                </div>

                <div className={styles.col}>
                    <h4 className={styles.colTitle}>Made by</h4>
                    <ul className={styles.colList}>
                        <li>
                            <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer" className={styles.colLink}>
                                <GitHubGlyph /> @Adi-404
                            </a>
                        </li>
                        <li>
                            <CoffeeEasterEgg linkedInUrl={LINKEDIN_URL} />
                        </li>
                    </ul>
                </div>
            </div>

            <div className={styles.fineprint}>
                <span className={styles.copyright}>
                    © {new Date().getFullYear()} des/toolkit ·
                    <span className={styles.copyrightScript}>made with warm hands</span>
                </span>
                <span className={styles.fineprintRight}>
                    open source · MIT
                </span>
            </div>
        </footer>
    );
}

/**
 * The Easter egg button. Two states:
 *   default →  "☕ Buy me a coffee"
 *   pranked →  "just kidding — say hi on LinkedIn" (clicking opens the profile)
 * Clicking once flips the state; the pranked-state button is itself a real
 * anchor so the second click navigates.
 */
function CoffeeEasterEgg({ linkedInUrl }: { linkedInUrl: string }) {
    const [pranked, setPranked] = useState(false);

    if (!pranked) {
        return (
            <button
                type="button"
                className={`${styles.colLink} ${styles.coffeeBtn}`}
                onClick={() => setPranked(true)}
                aria-label="Buy me a coffee"
            >
                <span className={styles.coffeeGlyph} aria-hidden="true">☕</span> Buy me a coffee
            </button>
        );
    }

    return (
        <a
            href={linkedInUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.colLink} ${styles.coffeeBtn} ${styles.coffeePranked}`}
            onClick={() => {
                // Reset for the next visitor — clicking does navigate, but
                // keep the state stable in case the link is opened in a new
                // tab and the user looks back at the original tab.
                setTimeout(() => setPranked(false), 800);
            }}
        >
            <LinkedInGlyph />
            <span className={styles.coffeeJk}>just kidding</span>{' '}
            <span className={styles.coffeeJkArrow}>→</span>{' '}
            <span className={styles.coffeeJkLink}>say hi on LinkedIn</span>
        </a>
    );
}

function GitHubGlyph() {
    return (
        <svg className={styles.glyph} viewBox="0 0 16 16" aria-hidden="true">
            <path
                d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.34c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.16-.89-1.16-.73-.5.06-.49.06-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.74.54 1.49v2.21c0 .21.15.46.55.38A8 8 0 0 0 8 0z"
                fill="currentColor"
            />
        </svg>
    );
}

function LinkedInGlyph() {
    return (
        <svg className={styles.glyph} viewBox="0 0 16 16" aria-hidden="true">
            <rect x="0" y="0" width="16" height="16" rx="2" fill="currentColor" />
            <path
                d="M4.5 6.5h-2v6h2v-6zM3.5 5.5a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3zM13.5 12.5h-2V9.4c0-.74-.01-1.7-1.03-1.7-1.04 0-1.2.81-1.2 1.65v3.15h-2v-6h1.92v.82h.03c.27-.5.92-1.03 1.9-1.03 2.03 0 2.4 1.34 2.4 3.08v3.13z"
                fill="var(--clay-canvas)"
            />
        </svg>
    );
}
