'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    listBoardsAction, createBoardAction, deleteBoardAction,
} from '@/app/actions/moodboard';
import type { BoardWithCount } from '@/lib/dal/moodboard';
import styles from './Moodboard.module.css';

const VARIANTS = ['varPink', 'varOchre', 'varLav', 'varPeach', 'varTeal', 'varCream'] as const;

export default function MoodboardIndex() {
    const router = useRouter();
    const [boards, setBoards] = useState<BoardWithCount[] | null>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        listBoardsAction().then(setBoards);
    }, []);

    async function newBoard() {
        if (creating) return;
        setCreating(true);
        const name = window.prompt('Name your board', 'Inspiration');
        if (name === null) { setCreating(false); return; }
        const board = await createBoardAction(name);
        router.push(`/moodboard/${board.id}`);
    }

    async function removeBoard(id: string, name: string) {
        if (!window.confirm(`Delete "${name}" and everything saved to it?`)) return;
        await deleteBoardAction(id);
        setBoards((cur) => cur?.filter((b) => b.id !== id) ?? null);
    }

    return (
        <div className={styles.scroll}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <div className={styles.eyebrow}>Inspiration · moodboard</div>
                        <h1 className={styles.title}>Save what you love.</h1>
                        <p className={styles.lede}>
                            Drop in links from Pinterest, Dribbble, Behance, Canva, Figma — anywhere.
                            We&rsquo;ll fetch the preview, title and source, and arrange them on a board.
                        </p>
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.btnPrimary} onClick={newBoard} disabled={creating}>
                            + New board
                        </button>
                    </div>
                </header>

                {boards === null ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyText}>Loading boards…</span>
                    </div>
                ) : boards.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyTitle}>No boards yet.</span>
                        <span className={styles.emptyText}>
                            Boards are little collections of design references. Make one for landing
                            pages, type ideas, colour palettes — whatever you keep coming back to.
                        </span>
                        <button className={styles.btnPrimary} onClick={newBoard} disabled={creating} style={{ marginTop: 8 }}>
                            + Create your first board
                        </button>
                    </div>
                ) : (
                    <div className={styles.boardGrid}>
                        {boards.map((b, i) => {
                            const variant = VARIANTS[i % VARIANTS.length];
                            return (
                                <div key={b.id} className={`${styles.boardCard} ${styles[variant]}`}>
                                    <Link
                                        href={`/moodboard/${b.id}`}
                                        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 'var(--clay-space-md)', flex: 1 }}
                                    >
                                        <span className={styles.boardChip}>Board</span>
                                        <span className={styles.boardName}>{b.name}</span>
                                    </Link>
                                    <div className={styles.boardMeta}>
                                        <span className={styles.boardCount}>
                                            {b.itemCount} item{b.itemCount === 1 ? '' : 's'}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles.iconBtn}
                                            onClick={() => removeBoard(b.id, b.name)}
                                            aria-label={`Delete ${b.name}`}
                                            style={{ background: 'rgba(255, 255, 255, 0.6)' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
