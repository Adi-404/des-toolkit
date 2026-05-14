'use client';

import { type ReactNode } from 'react';
import styles from './ToolHeader.module.css';

interface Props {
    /** Small uppercase eyebrow above the title, e.g. "Text · diff". */
    eyebrow?: string;
    /**
     * The page title. If `titleAccent` is set, the matching substring is
     * rendered in Caveat (script) so it visually rhymes with the marketing
     * pages' `.clay-title-script` treatment. The full string is read by
     * screen readers as one phrase.
     */
    title: string;
    /** Word inside `title` to render in the Caveat script accent. */
    titleAccent?: string;
    /** Optional brand colour for the accent — defaults to pink. */
    accentColor?: 'pink' | 'teal' | 'coral';
    /** Caveat tagline that rides beside the title baseline. */
    note?: string;
    /** Right-side controls (buttons, switches). */
    children?: ReactNode;
}

/**
 * Shared header for editor-style tools (DiffChecker, JsonFormatter,
 * MarkdownPreview, etc.). Matches the look-and-feel of the ToolPage
 * shared shell (Contrast, Bezier, Token translator, SVG viewer, …) so
 * every tool surface reads as one product instead of two divergent
 * patterns.
 *
 * Editor tools need their workspace below this header to take the rest
 * of the viewport, so the header has compact vertical padding compared
 * to the marketing-sized version on the shell — but the typography,
 * eyebrow, Caveat accent and right-aligned actions all line up.
 */
export default function ToolHeader({
    eyebrow,
    title,
    titleAccent,
    accentColor = 'pink',
    note,
    children,
}: Props) {
    const accentClass = `clay-title-script ${
        accentColor === 'teal'  ? 'clay-title-script-teal'  :
        accentColor === 'coral' ? 'clay-title-script-coral' : ''
    }`.trim();

    return (
        <header className={styles.header}>
            <div className={styles.titleBlock}>
                {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
                <h1 className={styles.titleRow}>
                    <span className={styles.titleText}>
                        {titleAccent ? renderTitleWithAccent(title, titleAccent, accentClass) : title}
                    </span>
                    {note && <span className={styles.titleNote}>{note}</span>}
                </h1>
            </div>
            {children && <div className={styles.actions}>{children}</div>}
        </header>
    );
}

/**
 * Splits the title on the first occurrence of `accent` and wraps that
 * substring in the script-accent span. Preserves the surrounding text
 * exactly so capitalization, punctuation and spaces stay put.
 */
function renderTitleWithAccent(title: string, accent: string, className: string): ReactNode {
    const idx = title.indexOf(accent);
    if (idx === -1) return title;
    return (
        <>
            {title.slice(0, idx)}
            <span className={className}>{accent}</span>
            {title.slice(idx + accent.length)}
        </>
    );
}
