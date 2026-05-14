'use client';

import { useState } from 'react';
import Link from 'next/link';
import ShortcutScribble from './ShortcutScribble';
import styles from './MarketingFooter.module.css';

/**
 * Marketing footer for the home/landing surface. Three columns:
 *   Brand   — name, tagline, alpha stamp
 *   Product — top-level routes the user can pick up from
 *   Made by — social links + the "buy me a coffee" Easter egg
 *
 * The Easter egg never actually opens a tipping page; on click it swaps the
 * label to "just kidding — say hi on GitHub instead" and the same button
 * becomes a link to the maintainer's GitHub profile.
 */

const GITHUB_PROFILE = 'https://github.com/Adi-404';
const GITHUB_REPO    = 'https://github.com/Adi-404/des-toolkit';

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
                            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className={styles.colLink}>
                                <GitHubGlyph /> Repo
                            </a>
                        </li>
                        <li>
                            <a href={GITHUB_PROFILE} target="_blank" rel="noopener noreferrer" className={styles.colLink}>
                                <ProfileGlyph /> @Adi-404
                            </a>
                        </li>
                        <li>
                            <CoffeeEasterEgg githubUrl={GITHUB_PROFILE} />
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
 *   pranked →  "just kidding — say hi on GitHub" (clicking opens the profile)
 * Clicking once flips the state; the pranked-state button is itself a real
 * anchor so the second click navigates.
 */
function CoffeeEasterEgg({ githubUrl }: { githubUrl: string }) {
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
            href={githubUrl}
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
            <span className={styles.coffeeJk}>just kidding</span>{' '}
            <span className={styles.coffeeJkArrow}>→</span>{' '}
            <span className={styles.coffeeJkLink}>say hi on GitHub</span>
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

function ProfileGlyph() {
    return (
        <svg className={styles.glyph} viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="6" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M2.5 14c.8-2.8 3-4 5.5-4s4.7 1.2 5.5 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}
