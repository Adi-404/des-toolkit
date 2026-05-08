'use server';

import { auth } from '@clerk/nextjs/server';
import {
    listAllItems, addItem, getItem, updateItemMetadata, deleteItem,
    listTags, createTag, updateTag, deleteTag, nextTagOrd,
    addItemTag, removeItemTag,
    TAG_COLORS,
    type PinItem, type Tag, type TagColor,
} from '@/lib/dal/moodboard';
import { fetchOgMetadata } from '@/lib/og';

function uid(): string { return crypto.randomUUID(); }
function nowIso(): string { return new Date().toISOString(); }

async function requireUserId(): Promise<string> {
    const { userId } = await auth();
    if (!userId) throw new Error('Sign in to use the moodboard.');
    return userId;
}

// ── Snapshot ──

export interface MoodboardSnapshot {
    items: PinItem[];
    tags: Tag[];
}

export async function getMoodboardAction(): Promise<MoodboardSnapshot> {
    const userId = await requireUserId();
    const [items, tags] = await Promise.all([
        listAllItems(userId),
        listTags(userId),
    ]);
    return { items, tags };
}

// ── Items ──

export interface AddLinkResult {
    item: PinItem;
    enriched: boolean;
}

export async function addLinkAction(url: string, tagIds: string[] = []): Promise<AddLinkResult> {
    const userId = await requireUserId();
    const og = await fetchOgMetadata(url);

    const id = uid();
    const addedAt = nowIso();
    await addItem({
        id,
        userId,
        url: og.url,
        title: og.title,
        description: og.description,
        imageUrl: og.imageUrl,
        siteName: og.siteName,
        addedAt,
    });

    // Apply pre-selected tags in one shot if provided.
    if (tagIds.length > 0) {
        await Promise.all(tagIds.map(tagId => addItemTag(userId, id, tagId)));
    }

    // Construct the returned item directly from what we wrote.
    // This avoids a second DB round-trip (getItem) that can race on remote
    // deployments (Turso) and return a stale imageUrl before replication catches up.
    const item: PinItem = {
        id,
        url: og.url,
        title: og.title,
        description: og.description,
        imageUrl: og.imageUrl,
        siteName: og.siteName,
        addedAt,
        tagIds: tagIds.slice(),
    };
    return { item, enriched: Boolean(og.imageUrl || og.description) };
}

// ── Picture upload ──
//
// Drop-an-image flow: client reads the file as base64, server stores it on
// the pin's image_url as a data URL so card rendering doesn't need a special
// case. Capped to keep the SQLite blobs reasonable.

const MAX_PICTURE_BYTES = 1_500_000; // 1.5 MB
const ACCEPTED_IMAGE_MIME = /^image\/(png|jpe?g|gif|webp|svg\+xml)$/i;

export interface UploadPictureInput {
    /** base64 of the image bytes (no data: prefix). */
    dataBase64: string;
    /** Original filename — used as the title fallback. */
    fileName: string;
    /** MIME type — used to build the data URL. */
    mimeType: string;
    /** Tag IDs to apply at upload time. */
    tagIds?: string[];
}

export async function addPictureAction(input: UploadPictureInput): Promise<AddLinkResult> {
    const userId = await requireUserId();

    if (!ACCEPTED_IMAGE_MIME.test(input.mimeType)) {
        throw new Error('Only PNG, JPG, GIF, WebP, and SVG images are supported.');
    }

    // base64 expands ~33% over raw bytes; convert and check actual size.
    let bytes: Buffer;
    try { bytes = Buffer.from(input.dataBase64, 'base64'); } catch {
        throw new Error('Could not read the uploaded image.');
    }
    if (bytes.length === 0) throw new Error('The uploaded image is empty.');
    if (bytes.length > MAX_PICTURE_BYTES) {
        throw new Error(`Image too large (${(bytes.length / 1024 / 1024).toFixed(2)} MB). Max is ${(MAX_PICTURE_BYTES / 1024 / 1024).toFixed(1)} MB.`);
    }

    const dataUrl = `data:${input.mimeType};base64,${input.dataBase64}`;
    const title = input.fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Untitled';

    const id = uid();
    const addedAt = nowIso();
    await addItem({
        id,
        userId,
        url: dataUrl,
        title: title.slice(0, 240),
        description: '',
        imageUrl: dataUrl,
        siteName: 'Uploaded',
        addedAt,
    });

    const tagIds = input.tagIds ?? [];
    if (tagIds.length > 0) {
        await Promise.all(tagIds.map(tagId => addItemTag(userId, id, tagId)));
    }

    const item: PinItem = {
        id,
        url: dataUrl,
        title: title.slice(0, 240),
        description: '',
        imageUrl: dataUrl,
        siteName: 'Uploaded',
        addedAt,
        tagIds: tagIds.slice(),
    };
    return { item, enriched: true };
}

export async function refreshItemAction(id: string, url: string): Promise<PinItem> {
    const userId = await requireUserId();
    const og = await fetchOgMetadata(url);
    await updateItemMetadata(userId, id, {
        title: og.title,
        description: og.description,
        imageUrl: og.imageUrl,
        siteName: og.siteName,
    });
    const item = await getItem(userId, id);
    if (!item) throw new Error('Item not found.');
    return item;
}

export async function deleteItemAction(id: string): Promise<void> {
    const userId = await requireUserId();
    await deleteItem(userId, id);
}

// ── Tags ──

export async function createTagAction(name: string, color: TagColor): Promise<Tag> {
    const userId = await requireUserId();
    const trimmed = name.trim().slice(0, 40) || 'Untitled';
    const safeColor: TagColor = TAG_COLORS.includes(color) ? color : 'pink';
    const tag: Tag = {
        id: uid(),
        name: trimmed,
        color: safeColor,
        ord: await nextTagOrd(userId),
        createdAt: nowIso(),
    };
    await createTag(userId, tag);
    return tag;
}

export async function updateTagAction(
    id: string,
    patch: { name?: string; color?: TagColor },
): Promise<void> {
    const userId = await requireUserId();
    const next: Partial<Pick<Tag, 'name' | 'color'>> = {};
    if (patch.name !== undefined) next.name = patch.name.trim().slice(0, 40) || 'Untitled';
    if (patch.color !== undefined && TAG_COLORS.includes(patch.color)) next.color = patch.color;
    await updateTag(userId, id, next);
}

export async function deleteTagAction(id: string): Promise<void> {
    const userId = await requireUserId();
    await deleteTag(userId, id);
}

// ── Item ↔ tag wiring ──

export async function toggleItemTagAction(itemId: string, tagId: string): Promise<boolean> {
    const userId = await requireUserId();
    const item = await getItem(userId, itemId);
    if (!item) throw new Error('Item not found.');
    const has = item.tagIds.includes(tagId);
    if (has) {
        await removeItemTag(userId, itemId, tagId);
        return false;
    }
    await addItemTag(userId, itemId, tagId);
    return true;
}
