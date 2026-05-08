import { db } from '../db';

export interface ClipTab {
    id: string;
    title: string;
    ord: number;
    createdAt: string;
    content: string;
}

export async function getClipboard(userId: string): Promise<{ tabs: ClipTab[]; activeId: string }> {
    const client = await db();

    const tabsRes = await client.execute({
        sql: `
            SELECT t.id, t.title, t.ord, t.created_at AS createdAt,
                   COALESCE(c.content, '') AS content
            FROM clipboard_tabs t
            LEFT JOIN clipboard_content c ON c.tab_id = t.id
            WHERE t.user_id = ?
            ORDER BY t.ord ASC
        `,
        args: [userId],
    });

    const tabs: ClipTab[] = tabsRes.rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        ord: Number(r.ord),
        createdAt: String(r.createdAt),
        content: String(r.content),
    }));

    const settingRes = await client.execute({
        sql: 'SELECT value FROM settings WHERE user_id = ? AND key = ?',
        args: [userId, 'clipboard_active_id'],
    });
    const activeId = settingRes.rows[0]
        ? String(settingRes.rows[0].value)
        : (tabs[0]?.id ?? '');

    return { tabs, activeId };
}

export async function upsertTab(userId: string, tab: ClipTab): Promise<void> {
    const client = await db();
    await client.execute({
        sql: `INSERT INTO clipboard_tabs (id, user_id, title, ord, created_at) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET title = excluded.title, ord = excluded.ord`,
        args: [tab.id, userId, tab.title, tab.ord, tab.createdAt],
    });
    await client.execute({
        sql: `INSERT INTO clipboard_content (tab_id, content) VALUES (?, ?)
              ON CONFLICT(tab_id) DO UPDATE SET content = excluded.content`,
        args: [tab.id, tab.content],
    });
}

export async function saveTabContent(userId: string, tabId: string, content: string): Promise<void> {
    const client = await db();
    // Verify ownership before writing — defence in depth.
    const own = await client.execute({
        sql: 'SELECT 1 FROM clipboard_tabs WHERE id = ? AND user_id = ?',
        args: [tabId, userId],
    });
    if (own.rows.length === 0) return;

    await client.execute({
        sql: `INSERT INTO clipboard_content (tab_id, content) VALUES (?, ?)
              ON CONFLICT(tab_id) DO UPDATE SET content = excluded.content`,
        args: [tabId, content],
    });
}

export async function deleteTab(userId: string, id: string): Promise<void> {
    const client = await db();
    await client.execute({
        sql: 'DELETE FROM clipboard_tabs WHERE id = ? AND user_id = ?',
        args: [id, userId],
    });
}

export async function setActiveTab(userId: string, id: string): Promise<void> {
    const client = await db();
    await client.execute({
        sql: `INSERT INTO settings (user_id, key, value) VALUES (?, 'clipboard_active_id', ?)
              ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
        args: [userId, id],
    });
}
