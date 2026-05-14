'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { addLinkAction } from '@/app/actions/moodboard';
import styles from './QuickAddPopover.module.css';

interface Props {
    open: boolean;
    /** Pixel anchor — the popover positions itself just below this point. */
    anchorRect: DOMRect | null;
    onClose: () => void;
}

type Status = { kind: 'idle' } | { kind: 'saving' } | { kind: 'ok'; title: string } | { kind: 'err'; text: string };

const POPOVER_WIDTH = 340;

export default function QuickAddPopover({ open, anchorRect, onClose }: Props) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<Status>({ kind: 'idle' });

    useEffect(() => {
        if (open) {
            // Reset state each time the popover opens.
            setUrl('');
            setStatus({ kind: 'idle' });
            // Focus on next tick — the input mounts in this same render.
            queueMicrotask(() => inputRef.current?.focus());
        }
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = url.trim();
        if (!trimmed || status.kind === 'saving') return;
        setStatus({ kind: 'saving' });
        try {
            const { item } = await addLinkAction(trimmed);
            setStatus({ kind: 'ok', title: item.title || trimmed });
            setUrl('');
            // Brief success display, then close.
            setTimeout(() => { onClose(); setStatus({ kind: 'idle' }); }, 1200);
        } catch (err) {
            setStatus({
                kind: 'err',
                text: err instanceof Error ? err.message : 'Could not save the link.',
            });
        }
    }

    if (!open) return null;
    if (typeof document === 'undefined') return null;

    // Position: right-align to the anchor and drop below it. Clamp horizontally
    // so the panel doesn't slip off the viewport edge on narrow screens.
    let left = 16;
    let top = 64;
    if (anchorRect) {
        const desiredLeft = anchorRect.right - POPOVER_WIDTH;
        left = Math.max(12, Math.min(desiredLeft, window.innerWidth - POPOVER_WIDTH - 12));
        top = anchorRect.bottom + 8;
    }

    return createPortal(
        <>
            <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
            <div
                className={styles.panel}
                style={{ left, top, width: POPOVER_WIDTH }}
                role="dialog"
                aria-label="Quick add to moodboard"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <span className={styles.eyebrow}>quick add</span>
                    <span className={styles.title}>Save to moodboard</span>
                </div>
                <form onSubmit={submit} className={styles.form}>
                    <input
                        ref={inputRef}
                        type="url"
                        inputMode="url"
                        className={styles.input}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste a link…"
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        disabled={status.kind === 'saving'}
                    />
                    <button
                        type="submit"
                        className={styles.saveBtn}
                        disabled={!url.trim() || status.kind === 'saving'}
                    >
                        {status.kind === 'saving' ? 'Saving…' : 'Save'}
                    </button>
                </form>
                {status.kind === 'ok' && (
                    <p className={styles.statusOk}>
                        ✓ Saved <span className={styles.statusTitle}>{status.title}</span>
                    </p>
                )}
                {status.kind === 'err' && (
                    <p className={styles.statusErr}>{status.text}</p>
                )}
                <button
                    type="button"
                    className={styles.viewLink}
                    onClick={() => { onClose(); router.push('/moodboard'); }}
                >
                    Open moodboard →
                </button>
            </div>
        </>,
        document.body,
    );
}
