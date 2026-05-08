'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    addFontByFileAction, addFontByUrlAction, deleteFontAction, listFontsAction,
} from '@/app/actions/fonts';
import type { FontRecord, FontFormat } from '@/lib/dal/fonts';
import {
    GOOGLE_FONTS, FONT_CATEGORIES, googleSpecimenUrl, batchedGoogleFontsCss,
    type FontCategory,
} from '@/lib/google-fonts';
import styles from './FontBook.module.css';

const SAMPLE = 'The quick brown fox jumps over the lazy dog. 1234567890';
const ACCEPTED_EXT = ['.woff2', '.woff', '.ttf', '.otf'];

function bytesToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
}

function formatFromFilename(name: string): FontFormat | null {
    const m = name.toLowerCase().match(/\.(woff2|woff|ttf|otf)$/);
    return m ? (m[1] as FontFormat) : null;
}

function familyFromFilename(name: string): string {
    return name
        .replace(/\.(woff2|woff|ttf|otf)$/i, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || 'Untitled';
}

function googleHref(family: string): string {
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700&display=swap`;
}

/** Build the @font-face / <link> declarations for every font in the list.
 *  Google fonts rely on <link> stylesheets; uploaded files get a @font-face
 *  rule that points at /api/fonts/[id]. Reference-only links contribute
 *  nothing — those cards render in a fallback font. */
function buildFontDeclarations(fonts: FontRecord[]): { links: string[]; faceCss: string } {
    const links: string[] = [];
    const faceRules: string[] = [];

    for (const f of fonts) {
        if (f.format === 'google') {
            links.push(googleHref(f.family));
            continue;
        }
        if (f.hasFile) {
            const format = f.format === 'woff2' ? 'woff2'
                : f.format === 'woff' ? 'woff'
                : f.format === 'ttf' ? 'truetype'
                : f.format === 'otf' ? 'opentype'
                : '';
            faceRules.push(
                `@font-face {\n` +
                `  font-family: '${f.family.replace(/'/g, "\\'")}';\n` +
                `  src: url('/api/fonts/${f.id}')${format ? ` format('${format}')` : ''};\n` +
                `  font-display: swap;\n` +
                `}`,
            );
        }
    }

    return { links, faceCss: faceRules.join('\n\n') };
}

export default function FontBook() {
    const [fonts, setFonts] = useState<FontRecord[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [url, setUrl] = useState('');
    const [pickedFile, setPickedFile] = useState<File | null>(null);
    const [familyOverride, setFamilyOverride] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Google Fonts picker state — search/filter Google's catalog and click
    // any preview to add it to the library in one step.
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerQuery, setPickerQuery] = useState('');
    const [pickerCategory, setPickerCategory] = useState<FontCategory | 'all'>('all');
    const [savingFamily, setSavingFamily] = useState<string | null>(null);

    async function refresh() {
        try {
            const list = await listFontsAction();
            setFonts(list);
            setLoadError(null);
        } catch (err) {
            setLoadError(err instanceof Error ? err.message : String(err));
        }
    }

    useEffect(() => { refresh(); }, []);

    // ── Picker derivations ──

    const filteredCatalog = useMemo(() => {
        const q = pickerQuery.trim().toLowerCase();
        return GOOGLE_FONTS.filter((f) => {
            if (pickerCategory !== 'all' && f.category !== pickerCategory) return false;
            if (q && !f.family.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [pickerQuery, pickerCategory]);

    const savedFamilies = useMemo(() => {
        const set = new Set<string>();
        for (const f of fonts ?? []) {
            if (f.format === 'google') set.add(f.family);
        }
        return set;
    }, [fonts]);

    // Inject a single <link> request that loads every visible picker font in
    // one round trip, so each card can render in its own face. Re-runs only
    // when the picker is open.
    useEffect(() => {
        const id = 'fontbook-picker-fonts';
        if (!pickerOpen) {
            // Clean up the picker's stylesheet when collapsed.
            const existing = document.getElementById(id);
            if (existing) existing.remove();
            return;
        }
        let link = document.getElementById(id) as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement('link');
            link.id = id;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        // Cap the batch so the URL stays under typical limits.
        link.href = batchedGoogleFontsCss(filteredCatalog.slice(0, 80).map((f) => f.family));
    }, [pickerOpen, filteredCatalog]);

    // Manage the single <link> tag that loads all Google Fonts on the page,
    // and a single <style> tag that holds all @font-face rules for uploads.
    const { links, faceCss } = useMemo(() => buildFontDeclarations(fonts ?? []), [fonts]);

    useEffect(() => {
        // Each Google Fonts URL gets its own <link>, identified by data attribute
        // so we can clean up cleanly when the list changes.
        const tag = 'data-fontbook-google';
        const existing = Array.from(document.querySelectorAll(`link[${tag}]`));
        const want = new Set(links);
        for (const el of existing) {
            const href = el.getAttribute('href');
            if (!href || !want.has(href)) el.remove();
        }
        const have = new Set(existing.map((el) => el.getAttribute('href')));
        for (const href of links) {
            if (have.has(href)) continue;
            const link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('href', href);
            link.setAttribute(tag, 'true');
            document.head.appendChild(link);
        }
    }, [links]);

    useEffect(() => {
        const id = 'fontbook-faces';
        let style = document.getElementById(id) as HTMLStyleElement | null;
        if (!style) {
            style = document.createElement('style');
            style.id = id;
            document.head.appendChild(style);
        }
        style.textContent = faceCss;
    }, [faceCss]);

    // ── Add by URL ──

    async function submitUrl(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = url.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        setStatus({ kind: 'info', text: 'Saving…' });
        try {
            const font = await addFontByUrlAction(trimmed);
            setFonts((cur) => [font, ...(cur ?? [])]);
            setUrl('');
            setStatus({
                kind: 'ok',
                text: font.format === 'google'
                    ? `Saved ${font.family} from Google Fonts.`
                    : `Saved ${font.family} as a reference link.`,
            });
        } catch (err) {
            setStatus({ kind: 'err', text: err instanceof Error ? err.message : 'Could not save.' });
        } finally {
            setSubmitting(false);
        }
    }

    // ── Add by file ──

    function pickFile(file: File | null) {
        if (!file) {
            setPickedFile(null);
            setFamilyOverride('');
            return;
        }
        const fmt = formatFromFilename(file.name);
        if (!fmt) {
            setStatus({ kind: 'err', text: 'Only .woff2, .woff, .ttf and .otf files are supported.' });
            setPickedFile(null);
            return;
        }
        setPickedFile(file);
        setFamilyOverride(familyFromFilename(file.name));
        setStatus(null);
    }

    async function submitFile(e: React.FormEvent) {
        e.preventDefault();
        if (!pickedFile || submitting) return;
        const fmt = formatFromFilename(pickedFile.name);
        if (!fmt) return;

        setSubmitting(true);
        setStatus({ kind: 'info', text: `Uploading ${pickedFile.name}…` });
        try {
            const buf = await pickedFile.arrayBuffer();
            const dataBase64 = bytesToBase64(buf);
            const font = await addFontByFileAction({
                family: familyOverride.trim() || familyFromFilename(pickedFile.name),
                fileName: pickedFile.name,
                dataBase64,
                format: fmt,
            });
            setFonts((cur) => [font, ...(cur ?? [])]);
            setPickedFile(null);
            setFamilyOverride('');
            if (fileInputRef.current) fileInputRef.current.value = '';
            setStatus({ kind: 'ok', text: `Saved ${font.family}.` });
        } catch (err) {
            setStatus({ kind: 'err', text: err instanceof Error ? err.message : 'Upload failed.' });
        } finally {
            setSubmitting(false);
        }
    }

    async function remove(id: string, family: string) {
        if (!window.confirm(`Remove "${family}" from your fontbook?`)) return;
        await deleteFontAction(id);
        setFonts((cur) => (cur ?? []).filter((f) => f.id !== id));
    }

    // ── Pick from Google Fonts catalog ──

    async function pickFromCatalog(family: string) {
        if (savingFamily) return;
        if (savedFamilies.has(family)) return;

        setSavingFamily(family);
        setStatus({ kind: 'info', text: `Saving ${family}…` });
        try {
            const font = await addFontByUrlAction(googleSpecimenUrl(family));
            setFonts((cur) => [font, ...(cur ?? [])]);
            setStatus({ kind: 'ok', text: `Saved ${family}.` });
        } catch (err) {
            setStatus({ kind: 'err', text: err instanceof Error ? err.message : 'Could not save.' });
        } finally {
            setSavingFamily(null);
        }
    }

    // ── Render ──

    return (
        <div className={styles.scroll}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <div className={styles.eyebrow}>fontbook</div>
                        <h1 className={styles.title}>Your type library.</h1>
                        <p className={styles.lede}>
                            Browse Google Fonts and add favourites with a click, paste any
                            URL, or upload your own <code>.woff2</code>, <code>.woff</code>,
                            <code>.ttf</code>, <code>.otf</code> file. Every card renders the
                            family live.
                        </p>
                    </div>
                </header>

                <div className={styles.addBar}>
                    <form className={styles.addRow} onSubmit={submitUrl}>
                        <input
                            type="url"
                            inputMode="url"
                            className={styles.urlInput}
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste a Google Fonts link (or a foundry URL)…"
                            spellCheck={false}
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                        <button type="submit" className={styles.btnPrimary} disabled={submitting || !url.trim()}>
                            {submitting && status?.kind === 'info' && status.text === 'Saving…'
                                ? <><span className={styles.spinner} /> Saving…</>
                                : '+ Save link'}
                        </button>
                        <span className={styles.divider}>or</span>
                        <button
                            type="button"
                            className={styles.btnSecondary}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            ↑ Upload font file
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={ACCEPTED_EXT.join(',')}
                            className={styles.uploadHidden}
                            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                        />
                    </form>

                    {pickedFile && (
                        <form className={styles.familyRow} onSubmit={submitFile}>
                            <span className={styles.fileMeta}>
                                ↑ {pickedFile.name} · {(pickedFile.size / 1024).toFixed(1)} KB
                            </span>
                            <input
                                type="text"
                                className={styles.familyInput}
                                value={familyOverride}
                                onChange={(e) => setFamilyOverride(e.target.value)}
                                placeholder="Family name"
                                maxLength={80}
                            />
                            <button type="submit" className={styles.btnPrimary} disabled={submitting || !familyOverride.trim()}>
                                {submitting ? <><span className={styles.spinner} /> Uploading…</> : 'Save font'}
                            </button>
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={() => pickFile(null)}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                        </form>
                    )}

                    {status && (
                        <p className={`${styles.status} ${
                            status.kind === 'err' ? styles.statusErr :
                            status.kind === 'ok' ? styles.statusOk : ''
                        }`}>
                            {status.text}
                        </p>
                    )}
                </div>

                {/* ── Google Fonts picker ── */}
                <div className={styles.pickerWrap}>
                    <button
                        type="button"
                        className={`${styles.pickerToggle} ${pickerOpen ? styles.pickerToggleOpen : ''}`}
                        onClick={() => setPickerOpen((o) => !o)}
                    >
                        <span>✦ Browse Google Fonts</span>
                        <span className={styles.pickerToggleChevron}>▾</span>
                    </button>

                    {pickerOpen && (
                        <div className={styles.pickerPanel}>
                            <div className={styles.pickerHeader}>
                                <input
                                    type="search"
                                    className={styles.pickerSearch}
                                    placeholder="Search 65 designer-curated families…"
                                    value={pickerQuery}
                                    onChange={(e) => setPickerQuery(e.target.value)}
                                    autoFocus
                                />
                                <span className={styles.pickerCount}>
                                    {filteredCatalog.length} of {GOOGLE_FONTS.length}
                                </span>
                            </div>

                            <div className={styles.pickerCategories}>
                                {FONT_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`${styles.pickerCategory} ${pickerCategory === cat.id ? styles.pickerCategoryActive : ''}`}
                                        onClick={() => setPickerCategory(cat.id)}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>

                            {filteredCatalog.length === 0 ? (
                                <div className={styles.pickerEmpty}>
                                    No fonts match &ldquo;{pickerQuery}&rdquo; in this category.
                                </div>
                            ) : (
                                <div className={styles.pickerGrid}>
                                    {filteredCatalog.map((font) => {
                                        const saved = savedFamilies.has(font.family);
                                        const saving = savingFamily === font.family;
                                        return (
                                            <button
                                                key={font.family}
                                                type="button"
                                                className={styles.pickerCard}
                                                onClick={() => pickFromCatalog(font.family)}
                                                disabled={saved || !!savingFamily}
                                                title={saved ? `${font.family} is already in your fontbook` : `Save ${font.family}`}
                                            >
                                                <span
                                                    className={styles.pickerCardSample}
                                                    style={{ fontFamily: `'${font.family}', sans-serif` }}
                                                >
                                                    Aa
                                                </span>
                                                <div className={styles.pickerCardFooter}>
                                                    <span className={styles.pickerCardName}>
                                                        {saving ? 'Saving…' : font.family}
                                                    </span>
                                                    {saved
                                                        ? <span className={styles.pickerCardSaved}>✓ Saved</span>
                                                        : <span className={styles.pickerCardCategory}>{font.category}</span>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {fonts === null && !loadError ? (
                    <p style={{ color: 'var(--clay-muted)' }}>Loading your fontbook…</p>
                ) : loadError ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyTitle} style={{ color: 'var(--clay-error)' }}>
                            Couldn&rsquo;t load your fonts.
                        </span>
                        <span className={styles.emptyText} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                            {loadError}
                        </span>
                    </div>
                ) : (fonts ?? []).length === 0 ? (
                    <div className={styles.empty}>
                        <span className={styles.emptyTitle}>No fonts saved yet.</span>
                        <span className={styles.emptyText}>
                            Paste a Google Fonts link, drop in a foundry URL as a reference, or
                            upload a font file from your machine to start your library.
                        </span>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {(fonts ?? []).map((font) => {
                            const renderable = font.format === 'google' || font.hasFile;
                            const stack = renderable
                                ? `'${font.family}', sans-serif`
                                : 'var(--clay-font-display)';
                            const chipColor = font.format === 'google'
                                ? 'var(--clay-brand-pink)'
                                : font.hasFile
                                    ? 'var(--clay-brand-lavender)'
                                    : 'var(--clay-brand-peach)';
                            return (
                                <div key={font.id} className={styles.card}>
                                    <div className={styles.cardTop}>
                                        <span className={styles.cardLabel}>Family</span>
                                        <span
                                            className={styles.cardChip}
                                            style={{ ['--chip-color' as string]: chipColor }}
                                        >
                                            <span className={styles.cardChipDot} />
                                            {font.sourceLabel || (font.hasFile ? 'Local' : 'Link')}
                                        </span>
                                    </div>

                                    <div
                                        className={`${styles.familyName} ${renderable ? '' : styles.familyNameFallback}`}
                                        style={{ fontFamily: stack }}
                                    >
                                        {font.family}
                                    </div>

                                    <div className={styles.sample} style={{ fontFamily: stack }}>
                                        {SAMPLE}
                                    </div>

                                    <div className={styles.cardFoot}>
                                        {font.sourceUrl ? (
                                            <a
                                                href={font.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.sourceLink}
                                            >
                                                {font.sourceUrl.replace(/^https?:\/\//, '')}
                                            </a>
                                        ) : (
                                            <span className={styles.sourceLink}>{font.fileName}</span>
                                        )}
                                        <button
                                            type="button"
                                            className={styles.iconBtn}
                                            onClick={() => remove(font.id, font.family)}
                                            aria-label="Remove font"
                                            title="Remove"
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
