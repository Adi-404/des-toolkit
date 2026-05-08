import { db } from '../db';

export async function getSetting(userId: string, key: string): Promise<string | null> {
    const client = await db();
    const result = await client.execute({
        sql: 'SELECT value FROM settings WHERE user_id = ? AND key = ?',
        args: [userId, key],
    });
    const row = result.rows[0];
    return row ? String(row.value) : null;
}

export async function setSetting(userId: string, key: string, value: string): Promise<void> {
    const client = await db();
    await client.execute({
        sql: `INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
              ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
        args: [userId, key, value],
    });
}
