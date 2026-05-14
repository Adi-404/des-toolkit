'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    addLinkAction, addPictureAction, createTagAction, deleteItemAction, deleteTagAction,
    getMoodboardAction, refreshItemAction, toggleItemTagAction,
} from '@/app/actions/moodboard';
import { TAG_COLORS, type PinItem, type Tag, type TagColor } from '@/lib/moodboard-types';
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, tooLargeMessage } from '@/lib/upload-limits';
import styles from './Moodboard.module.css';

// Deterministic bento sizing — stable per item id, well-mixed across the feed.
type TileSize = 'normal' | 'wide' | 'tall' | 'feature';

function hashId(id: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < id.length; i++) {
        h ^= id.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

function sizeFor(item: PinItem, index: number): TileSize {
    // No image → always 1×1 (looks awkward stretched).
    if (!item.imageUrl) return 'normal';
    const h = hashId(item.id) ^ index;
    const bucket = h % 100;
    if (bucket < 5)  return 'feature';   // 5%
    if (bucket < 20) return 'wide';      // 15%
    if (bucket < 30) return 'tall';      // 10%
    return 'normal';                     // 70%
}

const FALLBACK_HUES = ['#ff4d8b', '#1a3a3a', '#b8a4ed', '#ffb084', '#e8b94a', '#a4d4c5', '#ff6b5a'] as const;

function fallbackHue(seed: string): string {
    return FALLBACK_HUES[hashId(seed) % FALLBACK_HUES.length];
}

function hostnameOf(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

// Convert ArrayBuffer → base64 in chunks so large images don't blow the stack.
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

export default function Moodboard() {
    const [items, setItems] = useState<PinItem[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
    const [loaded, setLoaded] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [url, setUrl] = useState('');
    const [adding, setAdding] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);

    const [showTagCreator, setShowTagCreator] = useState(false);
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState<TagColor>('pink');

    // Tags to apply to the next saved item
    const [pendingTagIds, setPendingTagIds] = useState<Set<string>>(new Set());

    // ── File drop zone ──
    const [dropActive, setDropActive] = useState(false);
    const dragCounterRef = useRef(0);

    function onDragEnter(e: React.DragEvent) {
        e.preventDefault();
        if (Array.from(e.dataTransfer.types).includes('Files')) {
            dragCounterRef.current += 1;
            setDropActive(true);
        }
    }
    function onDragOver(e: React.DragEvent) { e.preventDefault(); }
    function onDragLeave(e: React.DragEvent) {
        e.preventDefault();
        dragCounterRef.current -= 1;
        if (dragCounterRef.current === 0) setDropActive(false);
    }
    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        dragCounterRef.current = 0;
        setDropActive(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) addPicture(file);
    }
    function togglePendingTag(id: string) {
        setPendingTagIds(cur => {
            const next = new Set(cur);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    }

    const [pickerForItemId, setPickerForItemId] = useState<string | null>(null);

    // Refresh on every action — server is the source of truth.
    async function refresh() {
        try {
            const snap = await getMoodboardAction();
            setItems(snap.items);
            setTags(snap.tags);
            setLoadError(null);
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setLoadError(msg);
            // Also surface in the dev console for stack traces.
            console.error('moodboard refresh failed:', err);
        } finally {
            setLoaded(true);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    // ── Filtering ──

    const filteredItems = useMemo(() => {
        if (selectedTags.size === 0) return items;
        return items.filter((item) => item.tagIds.some((id) => selectedTags.has(id)));
    }, [items, selectedTags]);

    const tagCounts = useMemo(() => {
        const map = new Map<string, number>();
        for (const item of items) for (const id of item.tagIds) map.set(id, (map.get(id) ?? 0) + 1);
        return map;
    }, [items]);

    function toggleTagFilter(id: string) {
        setSelectedTags((cur) => {
            const next = new Set(cur);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function clearFilters() {
        setSelectedTags(new Set());
    }

    // ── Add link ──

    async function add(e: React.FormEvent) {
        e.preventDefault();
        const value = url.trim();
        if (!value || adding) return;

        setAdding(true);
        setStatus({ kind: 'info', text: 'Fetching preview…' });
        try {
            const tagIds = [...pendingTagIds];
            const { item, enriched } = await addLinkAction(value, tagIds);
            setItems((cur) => [item, ...cur]);
            setUrl('');
            setPendingTagIds(new Set());
            setStatus({
                kind: 'ok',
                text: enriched
                    ? `Saved · ${item.siteName || hostnameOf(item.url)}`
                    : `Saved · ${hostnameOf(item.url)} (no preview — site may block scrapers)`,
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

    // ── Add picture (file upload) ──

    async function addPicture(file: File) {
        if (adding) return;
        if (file.size > MAX_UPLOAD_BYTES) {
            setStatus({ kind: 'err', text: tooLargeMessage(file.size) });
            return;
        }
        setAdding(true);
        setStatus({ kind: 'info', text: `Uploading ${file.name}…` });
        try {
            const tagIds = [...pendingTagIds];
            const buf = await file.arrayBuffer();
            const dataBase64 = arrayBufferToBase64(buf);
            const { item } = await addPictureAction({
                dataBase64,
                fileName: file.name,
                mimeType: file.type || 'image/png',
                tagIds,
            });
            setItems((cur) => [item, ...cur]);
            setPendingTagIds(new Set());
            setStatus({ kind: 'ok', text: `Saved ${file.name}.` });
        } catch (err) {
            setStatus({
                kind: 'err',
                text: err instanceof Error ? err.message : 'Could not save the picture.',
            });
        } finally {
            setAdding(false);
        }
    }

    async function removeItem(id: string) {
        if (!window.confirm('Remove this from your moodboard?')) return;
        await deleteItemAction(id);
        setItems((cur) => cur.filter((i) => i.id !== id));
    }

    async function refreshItem(item: PinItem) {
        setStatus({ kind: 'info', text: 'Refreshing preview…' });
        try {
            const updated = await refreshItemAction(item.id, item.url);
            setItems((cur) => cur.map((i) => (i.id === item.id ? updated : i)));
            setStatus({ kind: 'ok', text: 'Preview refreshed.' });
        } catch {
            setStatus({ kind: 'err', text: 'Refresh failed — leaving the previous preview.' });
        }
    }

    // ── Tag CRUD ──

    async function createNewTag() {
        const name = newTagName.trim();
        if (!name) return;
        const tag = await createTagAction(name, newTagColor);
        setTags((cur) => [...cur, tag]);
        setNewTagName('');
        setNewTagColor('pink');
        setShowTagCreator(false);
    }

    async function removeTag(id: string, name: string) {
        if (!window.confirm(`Delete the "${name}" tag? Items keep their other tags.`)) return;
        await deleteTagAction(id);
        setTags((cur) => cur.filter((t) => t.id !== id));
        setItems((cur) => cur.map((i) => ({ ...i, tagIds: i.tagIds.filter((tid) => tid !== id) })));
        setSelectedTags((cur) => {
            const next = new Set(cur);
            next.delete(id);
            return next;
        });
    }

    async function toggleItemTag(itemId: string, tagId: string) {
        const enabled = await toggleItemTagAction(itemId, tagId);
        setItems((cur) =>
            cur.map((i) =>
                i.id === itemId
                    ? {
                          ...i,
                          tagIds: enabled
                              ? [...new Set([...i.tagIds, tagId])]
                              : i.tagIds.filter((t) => t !== tagId),
                      }
                    : i,
            ),
        );
    }

    // ── Render ──

    return (
        <div
            className={styles.scroll}
            onDragEnter={onDragEnter}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {dropActive && (
                <div className={styles.dropOverlay}>
                    <div className={styles.dropOverlayInner}>
                        <span className={styles.dropOverlayIcon}>◰</span>
                        <span className={styles.dropOverlayText}>Drop image to save</span>
                    </div>
                </div>
            )}
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <div className={styles.eyebrow}>Inspiration · moodboard</div>
                        <h1 className={styles.title}>Save what you love.</h1>
                        <p className={styles.lede}>
                            Paste a link from <span className="clay-highlight clay-highlight-pink">anywhere</span> — Pinterest, Dribbble, Behance, Canva,
                            Figma. We fetch the preview; you tag and arrange.
                        </p>
                    </div>
                </header>

                <form className={styles.addBar} onSubmit={add}>
                    <input
                        type="url"
                        inputMode="url"
                        className={styles.addInput}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste a link to save…"
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                    />
                    <button
                        type="submit"
                        className={`${styles.btnPrimary} clay-gradient-border clay-gradient-border-animated`}
                        disabled={adding || !url.trim()}
                    >
                        {adding ? <><span className={styles.spinner} /> Saving…</> : '+ Save link'}
                    </button>
                    <button
                        type="button"
                        className={styles.uploadBtn}
                        onClick={() => uploadInputRef.current?.click()}
                        disabled={adding}
                        title={`Upload a picture from your machine (max ${MAX_UPLOAD_LABEL})`}
                        aria-label={`Upload a picture, max ${MAX_UPLOAD_LABEL}`}
                    >
                        ↑ Upload
                        <span className={styles.uploadHint}>max {MAX_UPLOAD_LABEL}</span>
                    </button>
                    <input
                        ref={uploadInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) addPicture(file);
                            // Reset so picking the same file again still triggers change
                            if (uploadInputRef.current) uploadInputRef.current.value = '';
                        }}
                    />
                    {tags.length > 0 && (
                        <div className={styles.addBarTagRow}>
                            <span className={styles.addBarTagLabel}>Tag on save:</span>
                            {tags.map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    data-tag-color={t.color}
                                    className={`${styles.addBarTagPill} ${pendingTagIds.has(t.id) ? styles.addBarTagPillActive : ''}`}
                                    onClick={() => togglePendingTag(t.id)}
                                >
                                    <span className={styles.tagPillDot} />
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    )}
                    {status && (
                        <p className={`${styles.addStatus} ${
                            status.kind === 'err' ? styles.addStatusErr :
                            status.kind === 'ok' ? styles.addStatusOk : ''
                        }`}>
                            {status.text}
                        </p>
                    )}
                </form>

                <TagBar
                    tags={tags}
                    selected={selectedTags}
                    counts={tagCounts}
                    onToggle={toggleTagFilter}
                    onClear={clearFilters}
                    onAddClick={() => setShowTagCreator((s) => !s)}
                    onDelete={removeTag}
                    creatorOpen={showTagCreator}
                    onCloseCreator={() => setShowTagCreator(false)}
                    newTagName={newTagName}
                    setNewTagName={setNewTagName}
                    newTagColor={newTagColor}
                    setNewTagColor={setNewTagColor}
                    onCreate={createNewTag}
                />

                {!loaded ? (
                    <p style={{ color: 'var(--clay-muted)' }}>Loading your moodboard…</p>
                ) : loadError ? (
                    <div className={styles.empty} style={{ borderStyle: 'solid', borderColor: 'var(--clay-error)' }}>
                        <span className={styles.emptyTitle} style={{ color: 'var(--clay-error)' }}>Couldn&rsquo;t load the moodboard.</span>
                        <span className={styles.emptyText} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap' }}>
                            {loadError}
                        </span>
                        <button type="button" className={styles.btnSecondary} onClick={refresh} style={{ marginTop: 8 }}>
                            ↻ Try again
                        </button>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyTitle}>
                            {items.length === 0 ? 'Nothing saved yet.' : 'No matches for this filter.'}
                        </span>
                        <span className={styles.emptyText}>
                            {items.length === 0
                                ? 'Paste a link above to start. Drop in references from anywhere on the web — we’ll grab the preview image, title and source.'
                                : 'Try a different tag, or click the active tags to clear the filter.'}
                        </span>
                    </div>
                ) : (
                    <div className={styles.bento}>
                        {filteredItems.map((item, idx) => (
                            <Tile
                                key={item.id}
                                item={item}
                                size={sizeFor(item, idx)}
                                tags={tags}
                                onRefresh={() => refreshItem(item)}
                                onRemove={() => removeItem(item.id)}
                                pickerOpen={pickerForItemId === item.id}
                                onTogglePicker={() =>
                                    setPickerForItemId(pickerForItemId === item.id ? null : item.id)
                                }
                                onToggleTag={(tagId) => toggleItemTag(item.id, tagId)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Sub-components ──

interface TagBarProps {
    tags: Tag[];
    selected: Set<string>;
    counts: Map<string, number>;
    onToggle: (id: string) => void;
    onClear: () => void;
    onAddClick: () => void;
    onDelete: (id: string, name: string) => void;
    creatorOpen: boolean;
    onCloseCreator: () => void;
    newTagName: string;
    setNewTagName: (s: string) => void;
    newTagColor: TagColor;
    setNewTagColor: (c: TagColor) => void;
    onCreate: () => void;
}

function TagBar(p: TagBarProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    return (
        <div className={styles.tagBar} ref={wrapRef} style={{ position: 'relative' }}>
            {p.tags.map((t) => {
                const active = p.selected.has(t.id);
                return (
                    <button
                        key={t.id}
                        type="button"
                        data-tag-color={t.color}
                        className={`${styles.tagPill} ${active ? styles.tagPillActive : ''}`}
                        onClick={() => p.onToggle(t.id)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            p.onDelete(t.id, t.name);
                        }}
                        title={`Right-click to delete · ${p.counts.get(t.id) ?? 0} item${(p.counts.get(t.id) ?? 0) === 1 ? '' : 's'}`}
                    >
                        <span className={styles.tagPillDot} />
                        <span>{t.name}</span>
                        <span className={styles.tagPillCount}>{p.counts.get(t.id) ?? 0}</span>
                    </button>
                );
            })}

            <button type="button" className={styles.tagAdd} onClick={p.onAddClick}>
                + Tag
            </button>

            {p.selected.size > 0 && (
                <>
                    <span className={styles.tagBarSep} />
                    <button type="button" className={styles.tagClear} onClick={p.onClear}>
                        Clear filter
                    </button>
                </>
            )}

            {p.creatorOpen && (
                <div className={styles.popover} style={{ top: 'calc(100% + 8px)', left: 0 }}>
                    <span className={styles.popoverLabel}>Tag name</span>
                    <input
                        autoFocus
                        className={styles.popoverInput}
                        value={p.newTagName}
                        onChange={(e) => p.setNewTagName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && p.onCreate()}
                        placeholder="e.g. Layouts"
                        maxLength={40}
                    />
                    <span className={styles.popoverLabel}>Color</span>
                    <div className={styles.colorRow}>
                        {TAG_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                data-tag-color={c}
                                className={`${styles.colorSwatch} ${p.newTagColor === c ? styles.colorSwatchActive : ''}`}
                                style={{ ['--swatch' as string]: 'var(--tag-color)' }}
                                onClick={() => p.setNewTagColor(c)}
                                aria-label={c}
                            />
                        ))}
                    </div>
                    <div className={styles.popoverActions}>
                        <button type="button" className={styles.smallBtn} onClick={p.onCloseCreator}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={`${styles.smallBtn} ${styles.smallBtnPrimary}`}
                            onClick={p.onCreate}
                            disabled={!p.newTagName.trim()}
                        >
                            Create tag
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

interface TileProps {
    item: PinItem;
    size: TileSize;
    tags: Tag[];
    onRefresh: () => void;
    onRemove: () => void;
    pickerOpen: boolean;
    onTogglePicker: () => void;
    onToggleTag: (tagId: string) => void;
}

function Tile({ item, size, tags, onRefresh, onRemove, pickerOpen, onTogglePicker, onToggleTag }: TileProps) {
    const sizeClass =
        size === 'wide' ? styles.tileWide :
        size === 'tall' ? styles.tileTall :
        size === 'feature' ? styles.tileFeatured : '';

    const host = hostnameOf(item.url);
    const itemTags = tags.filter((t) => item.tagIds.includes(t.id));

    return (
        <div className={`${styles.tile} ${sizeClass}`}>
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit', flex: 1, minHeight: 0 }}
            >
                {item.imageUrl ? (
                    <div
                        className={styles.tileImage}
                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                        aria-label={item.title}
                    />
                ) : (
                    <div
                        className={styles.tileFallback}
                        style={{ ['--fallback-bg' as string]: fallbackHue(item.url) }}
                    >
                        {host}
                    </div>
                )}
                <div className={styles.tileBody}>
                    <span className={styles.tileTitle}>{item.title || host}</span>
                    <span className={styles.tileSite}>{item.siteName || host}</span>
                    {itemTags.length > 0 && (
                        <div className={styles.tileTagRow}>
                            {itemTags.map((t) => (
                                <span
                                    key={t.id}
                                    data-tag-color={t.color}
                                    className={styles.tileTagPill}
                                >
                                    {t.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </a>

            <div className={styles.tileActions}>
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onTogglePicker}
                    aria-label="Tag this item"
                    title="Tag"
                >
                    🏷
                </button>
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onRefresh}
                    aria-label="Refresh preview"
                    title="Refresh"
                >
                    ↻
                </button>
                <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    onClick={onRemove}
                    aria-label="Remove"
                    title="Remove"
                >
                    ✕
                </button>
            </div>

            {pickerOpen && (
                <div className={styles.tagPicker}>
                    {tags.length === 0 ? (
                        <div className={styles.tagPickerEmpty}>
                            No tags yet. Use the &ldquo;+ Tag&rdquo; button at the top.
                        </div>
                    ) : (
                        tags.map((t) => {
                            const active = item.tagIds.includes(t.id);
                            return (
                                <button
                                    key={t.id}
                                    type="button"
                                    data-tag-color={t.color}
                                    className={`${styles.tagPickerOption} ${active ? styles.tagPickerOptionActive : ''}`}
                                    onClick={() => onToggleTag(t.id)}
                                >
                                    <span className={styles.tagPillDot} />
                                    <span>{t.name}</span>
                                    <span className={styles.tagPickerCheck}>✓</span>
                                </button>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
