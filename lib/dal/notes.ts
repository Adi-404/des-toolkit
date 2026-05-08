import { db } from '../db';

export interface Note {
    id: string;
    title: string;
    body: string;
    createdAt: string;
}

export async function getNotes(userId: string): Promise<Note[]> {
    const client = await db();
    const res = await client.execute({
        sql: 'SELECT id, title, body, created_at AS createdAt FROM notes WHERE user_id = ? ORDER BY created_at DESC',
        args: [userId],
    });
    return res.rows.map((r) => ({
        id: String(r.id),
        title: String(r.title),
        body: String(r.body),
        createdAt: String(r.createdAt),
    }));
}

export async function createNote(userId: string, note: Note): Promise<void> {
    const client = await db();
    await client.execute({
        sql: 'INSERT INTO notes (id, user_id, title, body, created_at) VALUES (?, ?, ?, ?, ?)',
        args: [note.id, userId, note.title, note.body, note.createdAt],
    });
}

export async function deleteNote(userId: string, id: string): Promise<void> {
    const client = await db();
    await client.execute({
        sql: 'DELETE FROM notes WHERE id = ? AND user_id = ?',
        args: [id, userId],
    });
}
