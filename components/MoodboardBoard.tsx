'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    addLinkAction, deleteBoardAction, deleteItemAction,
    getBoardAction, getItemsAction, refreshItemAction, renameBoardAction,
} from '@/app/actions/moodboard';
import type { Board, BoardItem } from '@/lib/dal/moodboard';
import styles from './Moodboard.module.css';

const FALLBACK_HUES = ['#ff4d8b', '#1a3a3a', '#b8a4ed', '#ffb084', '#e8b94a', '#a4d4c5', '#ff6b5a'] as const;

function hueFor(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return FALLBACK_HUES[h % FALLBACK_HUES.length];
}

function hostnameOf(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

interface Props { boardId: string; }

export default function MoodboardBoard({ boardId }: Props) {
    const router = useRouter();
    const [board, setBoard] = useState<Board | null | undefined>(undefined);
    const [items, setItems] = useState<BoardItem[]>([]);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [adding, setAdding] = useState(false);
    const [status, setStatus] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);

    useEffect(() => {
        let cancelled = false;
        Promise.all([getBoardAction(boardId), getItemsAction(boardId)]).then(([b, its]) => {
            if (cancelled) return;
            setBoard(b);
            setName(b?.name ?? '');
            setItems(its);
        });
        return () => { cancelled = true; };
    }, [boardId]);

    async function commitName() {
        if (!board) return;
        const next = name.trim() || 'Untitled board';
        if (next === board.name) return;
        await renameBoardAction(board.id, next);
        setBoard({ ...board, name: next });
        setName(next);
    }

    async function add(e: React.FormEvent) {
        e.preventDefault();
        if (adding) return;
        const value = url.trim();
        if (!value) return;

        setAdding(true);
        setStatus({ kind: 'info', text: 'Fetching preview…' });
        try {
            const { item, enriched } = await addLinkAction(boardId, value);
            setItems((cur) => [...cur, item]);
            setUrl('');
            setStatus({
                kind: 'ok',
                text: enriched
                    ? `Saved · ${item.siteName || hostnameOf(item.url)}`
                    : `Saved · ${hostnameOf(item.url)} (no preview available — site may block scrapers)`,
            });
        } catch (err) {
            setStatus({
                kind: 'err',
                text: err instanceof Error ? err.message : 'Could not save that link.',
            });
        } finally {
            setAdding(false);
        }
    }

    async function remove(id: string) {
        if (!window.confirm('Remove this from the board?')) return;
        await deleteItemAction(id);
        setItems((cur) => cur.filter((i) => i.id !== id));
    }

    async function refresh(item: BoardItem) {
        setStatus({ kind: 'info', text: 'Refreshing preview…' });
        try {
            const updated = await refreshItemAction(item.id, item.url, boardId);
            setItems((cur) => cur.map((i) => (i.id === item.id ? updated : i)));
            setStatus({ kind: 'ok', text: 'Preview refreshed.' });
        } catch {
            setStatus({ kind: 'err', text: 'Refresh failed — leaving the previous preview in place.' });
        }
    }

    async function removeBoard() {
        if (!board) return;
        if (!window.confirm(`Delete "${board.name}" and all ${items.length} items?`)) return;
        await deleteBoardAction(board.id);
        router.push('/moodboard');
    }

    if (board === undefined) {
        return (
            <div className={styles.scroll}>
                <div className={styles.container}>
                    <p style={{ color: 'var(--clay-muted)' }}>Loading board…</p>
                </div>
            </div>
        );
    }

    if (board === null) {
        return (
            <div className={styles.scroll}>
                <div className={styles.container}>
                    <div className={styles.empty}>
                        <span className={styles.emptyTitle}>Board not found.</span>
                        <span className={styles.emptyText}>
                            It may have been deleted. Head back to your boards to make a new one.
                        </span>
                        <Link href="/moodboard" className={styles.btnSecondary} style={{ marginTop: 8 }}>
                            ← Back to boards
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.scroll}>
            <div className={styles.container}>
                <div className={styles.crumbs}>
                    <Link href="/moodboard">Moodboard</Link>
                    <span>/</span>
                    <span>{board.name}</span>
                </div>

                <div className={styles.header}>
                    <div style={{ flex: 1, minWidth: 240 }}>
                        <div className={styles.eyebrow}>Board</div>
                        <div className={styles.boardHeaderRow}>
                            <input
                                className={styles.boardNameInput}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onBlur={commitName}
                                onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
                                spellCheck={false}
                                aria-label="Board name"
                            />
                        </div>
                        <p className={styles.lede} style={{ marginTop: 8 }}>
                            {items.length === 0
                                ? 'Nothing here yet — paste a link below to start.'
                                : `${items.length} item${items.length === 1 ? '' : 's'} saved.`}
                        </p>
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.btnSecondary} onClick={removeBoard}>✕ Delete board</button>
                    </div>
                </div>

                <form className={styles.addBar} onSubmit={add}>
                    <input
                        type="url"
                        inputMode="url"
                        className={styles.addInput}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste a link from Pinterest, Dribbble, Canva, Figma…"
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                    />
                    <button type="submit" className={styles.btnPrimary} disabled={adding || !url.trim()}>
                        {adding ? <><span className={styles.spinner} /> Saving…</> : '+ Save link'}
                    </button>
                    {status && (
                        <p
                            className={`${styles.addStatus} ${
                                status.kind === 'err' ? styles.addStatusErr :
                                status.kind === 'ok' ? styles.addStatusOk : ''
                            }`}
                        >
                            {status.text}
                        </p>
                    )}
                </form>

                {items.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyTitle}>This board is empty.</span>
                        <span className={styles.emptyText}>
                            Paste any link above and we&rsquo;ll fetch the preview image, title and
                            description from the page&rsquo;s OpenGraph tags. Sites that block scrapers
                            (Pinterest, Canva sometimes) save as URL-only cards.
                        </span>
                    </div>
                ) : (
                    <div className={styles.itemGrid}>
                        {items.map((item) => {
                            const host = hostnameOf(item.url);
                            const fallback = hueFor(item.url);
                            return (
                                <div key={item.id} className={styles.item}>
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                                    >
                                        {item.imageUrl ? (
                                            <div
                                                className={styles.itemImage}
                                                style={{ backgroundImage: `url("${item.imageUrl}")` }}
                                                aria-label={item.title}
                                            />
                                        ) : (
                                            <div
                                                className={styles.itemFallback}
                                                style={{ background: fallback }}
                                            >
                                                {host}
                                            </div>
                                        )}
                                        <div className={styles.itemBody}>
                                            <span className={styles.itemTitle}>
                                                {item.title || host}
                                            </span>
                                            {item.description && (
                                                <span className={styles.itemDesc}>{item.description}</span>
                                            )}
                                            <div className={styles.itemFoot}>
                                                <span className={styles.itemSite} title={item.url}>
                                                    {item.siteName || host}
                                                </span>
                                                <div className={styles.itemActions}>
                                                    <button
                                                        type="button"
                                                        className={styles.iconBtn}
                                                        onClick={(e) => { e.preventDefault(); refresh(item); }}
                                                        aria-label="Refresh preview"
                                                        title="Refresh preview"
                                                    >
                                                        ↻
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                        onClick={(e) => { e.preventDefault(); remove(item.id); }}
                                                        aria-label="Remove"
                                                        title="Remove"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
