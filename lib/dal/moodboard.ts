import { db } from '../db';
import type { PinItem, Tag, TagColor } from '../moodboard-types';

// Re-export so existing server-side callers (actions) keep their import paths.
export type { PinItem, Tag, TagColor };
export { TAG_COLORS } from '../moodboard-types';

interface NewPinInput {
    id: string;
    userId: string;
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    siteName: string;
    addedAt: string;
}

// ── Items ──────────────────────────────────────────────────────────────────

export async function listAllItems(userId: string): Promise<PinItem[]> {
    const client = await db();

    const itemRes = await client.execute({
        sql: `SELECT id, url, title, description, image_url AS imageUrl,
                     site_name AS siteName, added_at AS addedAt
              FROM moodboard_items
              WHERE user_id = ?
              ORDER BY added_at DESC`,
        args: [userId],
    });
    if (itemRes.rows.length === 0) return [];

    // Fetch all item↔tag links for this user's items in one query.
    const ids = itemRes.rows.map((r) => String(r.id));
    const placeholders = ids.map(() => '?').join(',');
    const linkRes = await client.execute({
        sql: `SELECT item_id AS itemId, tag_id AS tagId
              FROM moodboard_item_tags
              WHERE item_id IN (${placeholders})`,
        args: ids,
    });
    const tagMap = new Map<string, string[]>();
    for (const row of linkRes.rows) {
        const itemId = String(row.itemId);
        const tagId = String(row.tagId);
        const arr = tagMap.get(itemId) ?? [];
        arr.push(tagId);
        tagMap.set(itemId, arr);
    }

    return itemRes.rows.map((r) => {
        const id = String(r.id);
        return {
            id,
            url: String(r.url),
            title: String(r.title ?? ''),
            description: String(r.description ?? ''),
            imageUrl: String(r.imageUrl ?? ''),
            siteName: String(r.siteName ?? ''),
            addedAt: String(r.addedAt),
            tagIds: tagMap.get(id) ?? [],
        };
    });
}

export async function addItem(input: NewPinInput): Promise<void> {
    const client = await db();
    await client.execute({
        sql: `INSERT INTO moodboard_items
                (id, user_id, url, title, description, image_url, site_name, added_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            input.id, input.userId, input.url, input.title, input.description,
            input.imageUrl, input.siteName, input.addedAt,
        ],
    });
}

export async function getItem(userId: string, id: string): Promise<PinItem | null> {
    const client = await db();
    const res = await client.execute({
        sql: `SELECT id, url, title, description, image_url AS imageUrl,
                     site_name AS siteName, added_at AS addedAt
              FROM moodboard_items
              WHERE id = ? AND user_id = ?`,
        args: [id, userId],
    });
    if (res.rows.length === 0) return null;
    const r = res.rows[0];

    const linkRes = await client.execute({
        sql: 'SELECT tag_id AS tagId FROM moodboard_item_tags WHERE item_id = ?',
        args: [id],
    });

    return {
        id: String(r.id),
        url: String(r.url),
        title: String(r.title ?? ''),
        description: String(r.description ?? ''),
        imageUrl: String(r.imageUrl ?? ''),
        siteName: String(r.siteName ?? ''),
        addedAt: String(r.addedAt),
        tagIds: linkRes.rows.map((row) => String(row.tagId)),
    };
}

export async function updateItemMetadata(
    userId: string,
    id: string,
    patch: Partial<Pick<PinItem, 'title' | 'description' | 'imageUrl' | 'siteName'>>,
): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (patch.title !== undefined) { fields.push('title = ?'); values.push(patch.title); }
    if (patch.description !== undefined) { fields.push('description = ?'); values.push(patch.description); }
    if (patch.imageUrl !== undefined) { fields.push('image_url = ?'); values.push(patch.imageUrl); }
    if (patch.siteName !== undefined) { fields.push('site_name = ?'); values.push(patch.siteName); }
    if (fields.length === 0) return;
    values.push(id, userId);

    const client = await db();
    await client.execute({
        sql: `UPDATE moodboard_items SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
        args: values as (string | number | bigint | ArrayBuffer | null)[],
    });
}

export async function deleteItem(userId: string, id: string): Promise<void> {
    const client = await db();
    await client.execute({
        sql: 'DELETE FROM moodboard_items WHERE id = ? AND user_id = ?',
        args: [id, userId],
    });
}

// ── Tags ───────────────────────────────────────────────────────────────────

export async function listTags(userId: string): Promise<Tag[]> {
    const client = await db();
    const res = await client.execute({
        sql: `SELECT id, name, color, ord, created_at AS createdAt
              FROM moodboard_tags
              WHERE user_id = ?
              ORDER BY ord ASC, created_at ASC`,
        args: [userId],
    });
    return res.rows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        color: String(r.color) as TagColor,
        ord: Number(r.ord),
        createdAt: String(r.createdAt),
    }));
}

export async function createTag(userId: string, tag: Tag): Promise<void> {
    const client = await db();
    await client.execute({
        sql: 'INSERT INTO moodboard_tags (id, user_id, name, color, ord, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: [tag.id, userId, tag.name, tag.color, tag.ord, tag.createdAt],
    });
}

export async function nextTagOrd(userId: string): Promise<number> {
    const client = await db();
    const res = await client.execute({
        sql: 'SELECT COALESCE(MAX(ord), -1) + 1 AS n FROM moodboard_tags WHERE user_id = ?',
        args: [userId],
    });
    return Number(res.rows[0]?.n ?? 0);
}

export async function updateTag(
    userId: string,
    id: string,
    patch: Partial<Pick<Tag, 'name' | 'color'>>,
): Promise<void> {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (patch.name !== undefined) { fields.push('name = ?'); values.push(patch.name); }
    if (patch.color !== undefined) { fields.push('color = ?'); values.push(patch.color); }
    if (fields.length === 0) return;
    values.push(id, userId);

    const client = await db();
    await client.execute({
        sql: `UPDATE moodboard_tags SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
        args: values as (string | number | bigint | ArrayBuffer | null)[],
    });
}

export async function deleteTag(userId: string, id: string): Promise<void> {
    const client = await db();
    await client.execute({
        sql: 'DELETE FROM moodboard_tags WHERE id = ? AND user_id = ?',
        args: [id, userId],
    });
}

// ── Item ↔ tag linking ─────────────────────────────────────────────────────

export async function addItemTag(userId: string, itemId: string, tagId: string): Promise<void> {
    const client = await db();
    // Ownership check on both sides — never let a user link someone else's pin/tag.
    const owns = await client.execute({
        sql: `SELECT 1 FROM moodboard_items i
              JOIN moodboard_tags t ON 1=1
              WHERE i.id = ? AND i.user_id = ?
                AND t.id = ? AND t.user_id = ?`,
        args: [itemId, userId, tagId, userId],
    });
    if (owns.rows.length === 0) return;

    await client.execute({
        sql: 'INSERT OR IGNORE INTO moodboard_item_tags (item_id, tag_id) VALUES (?, ?)',
        args: [itemId, tagId],
    });
}

export async function removeItemTag(userId: string, itemId: string, tagId: string): Promise<void> {
    const client = await db();
    const owns = await client.execute({
        sql: 'SELECT 1 FROM moodboard_items WHERE id = ? AND user_id = ?',
        args: [itemId, userId],
    });
    if (owns.rows.length === 0) return;

    await client.execute({
        sql: 'DELETE FROM moodboard_item_tags WHERE item_id = ? AND tag_id = ?',
        args: [itemId, tagId],
    });
}
