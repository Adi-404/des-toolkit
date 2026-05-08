'use server';

import { auth } from '@clerk/nextjs/server';
import {
    listFonts, addFont, deleteFont,
    type FontRecord, type FontFormat,
} from '@/lib/dal/fonts';

const MAX_BYTES = 1_500_000; // 1.5 MB cap on uploads

const ACCEPTED_FORMATS: FontFormat[] = ['woff2', 'woff', 'ttf', 'otf'];

async function requireUserId(): Promise<string> {
    const { userId } = await auth();
    if (!userId) throw new Error('Sign in to manage your fonts.');
    return userId;
}

function uid() { return crypto.randomUUID(); }
function nowIso() { return new Date().toISOString(); }

// ── List / delete ──

export async function listFontsAction(): Promise<FontRecord[]> {
    const userId = await requireUserId();
    return listFonts(userId);
}

export async function deleteFontAction(id: string): Promise<void> {
    const userId = await requireUserId();
    await deleteFont(userId, id);
}

// ── Add by URL ──
//
// Google Fonts links resolve to a hosted, loadable family. Anything else is
// stored as a "reference link" — not loaded, but kept around as a bookmark.

export async function addFontByUrlAction(rawUrl: string): Promise<FontRecord> {
    const userId = await requireUserId();
    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch {
        throw new Error('That doesn’t look like a URL.');
    }

    const isGoogle = /(^|\.)fonts\.google\.com$/i.test(parsed.hostname);
    let family = '';
    let format: FontFormat = 'link';
    let sourceLabel = parsed.hostname.replace(/^www\./, '');

    if (isGoogle) {
        // /specimen/{Family} or /share?selection.family={Family}
        const specimenMatch = parsed.pathname.match(/\/specimen\/([^/]+)/);
        if (specimenMatch) {
            family = decodeURIComponent(specimenMatch[1]).replace(/\+/g, ' ');
        } else {
            const fam = parsed.searchParams.get('family')
                ?? parsed.searchParams.get('selection.family')
                ?? '';
            family = fam.split('|')[0].split(':')[0].replace(/\+/g, ' ');
        }
        if (family) {
            format = 'google';
            sourceLabel = 'Google Fonts';
        }
    }

    if (!family) {
        // Fall back to the last URL segment so the card has *something* to show.
        const lastSeg = parsed.pathname.split('/').filter(Boolean).pop() ?? parsed.hostname;
        family = decodeURIComponent(lastSeg).replace(/[-_+]+/g, ' ').replace(/\.[^.]+$/, '');
        family = family.replace(/\b\w/g, (c) => c.toUpperCase()).trim() || 'Untitled';
    }

    const id = uid();
    await addFont({
        id,
        userId,
        family: family.slice(0, 80),
        sourceUrl: parsed.toString(),
        sourceLabel,
        format,
        fileName: '',
        data: null,
        addedAt: nowIso(),
    });

    return {
        id,
        family,
        sourceUrl: parsed.toString(),
        sourceLabel,
        format,
        fileName: '',
        addedAt: nowIso(),
        hasFile: false,
    };
}

// ── Add by file upload ──

export interface UploadedFontInput {
    family: string;
    fileName: string;
    /** base64-encoded file bytes (sent from the client). */
    dataBase64: string;
    /** woff2 / woff / ttf / otf — derived client-side from the filename. */
    format: string;
}

export async function addFontByFileAction(input: UploadedFontInput): Promise<FontRecord> {
    const userId = await requireUserId();

    const family = input.family.trim().slice(0, 80);
    if (!family) throw new Error('Family name is required.');

    const fmt = input.format.toLowerCase() as FontFormat;
    if (!ACCEPTED_FORMATS.includes(fmt)) {
        throw new Error('Only .woff2, .woff, .ttf and .otf files are supported.');
    }

    let bytes: Buffer;
    try { bytes = Buffer.from(input.dataBase64, 'base64'); } catch {
        throw new Error('Could not decode the uploaded file.');
    }
    if (bytes.length === 0) throw new Error('The uploaded file is empty.');
    if (bytes.length > MAX_BYTES) {
        throw new Error(`Upload is too large (${(bytes.length / 1024 / 1024).toFixed(2)} MB). Max is ${(MAX_BYTES / 1024 / 1024).toFixed(1)} MB.`);
    }

    const id = uid();
    const addedAt = nowIso();
    await addFont({
        id,
        userId,
        family,
        sourceUrl: '',
        sourceLabel: `Local · ${fmt}`,
        format: fmt,
        fileName: input.fileName.slice(0, 200),
        data: new Uint8Array(bytes),
        addedAt,
    });

    return {
        id,
        family,
        sourceUrl: '',
        sourceLabel: `Local · ${fmt}`,
        format: fmt,
        fileName: input.fileName,
        addedAt,
        hasFile: true,
    };
}
