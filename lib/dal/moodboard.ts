import db from '../db';

export interface Board {
    id: string;
    name: string;
    ord: number;
    createdAt: string;
}

export interface BoardWithCount extends Board {
    itemCount: number;
}

export interface BoardItem {
    id: string;
    boardId: string;
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    siteName: string;
    ord: number;
    addedAt: string;
}

// ── Boards ──

export function listBoards(): BoardWithCount[] {
    return db.prepare(`
        SELECT
            b.id, b.name, b.ord, b.created_at AS createdAt,
            (SELECT COUNT(*) FROM moodboard_items i WHERE i.board_id = b.id) AS itemCount
        FROM moodboards b
        ORDER BY b.ord ASC, b.created_at ASC
    `).all() as BoardWithCount[];
}

export function getBoard(id: string): Board | null {
    const row = db.prepare(
        'SELECT id, name, ord, created_at AS createdAt FROM moodboards WHERE id = ?'
    ).get(id) as Board | undefined;
    return row ?? null;
}

export function createBoard(board: Board): void {
    db.prepare(
        'INSERT INTO moodboards (id, name, ord, created_at) VALUES (?, ?, ?, ?)'
    ).run(board.id, board.name, board.ord, board.createdAt);
}

export function renameBoard(id: string, name: string): void {
    db.prepare('UPDATE moodboards SET name = ? WHERE id = ?').run(name, id);
}

export function deleteBoard(id: string): void {
    // ON DELETE CASCADE handles items; foreign_keys pragma is on in db.ts.
    db.prepare('DELETE FROM moodboards WHERE id = ?').run(id);
}

// ── Items ──

export function getItems(boardId: string): BoardItem[] {
    return db.prepare(`
        SELECT id, board_id AS boardId, url, title, description, image_url AS imageUrl,
               site_name AS siteName, ord, added_at AS addedAt
        FROM moodboard_items
        WHERE board_id = ?
        ORDER BY ord ASC, added_at DESC
    `).all(boardId) as BoardItem[];
}

export function addItem(item: BoardItem): void {
    db.prepare(`
        INSERT INTO moodboard_items
            (id, board_id, url, title, description, image_url, site_name, ord, added_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        item.id, item.boardId, item.url, item.title, item.description,
        item.imageUrl, item.siteName, item.ord, item.addedAt,
    );
}

export function updateItem(id: string, patch: Partial<Pick<BoardItem, 'title' | 'description' | 'imageUrl' | 'siteName'>>): void {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (patch.title !== undefined) { fields.push('title = ?'); values.push(patch.title); }
    if (patch.description !== undefined) { fields.push('description = ?'); values.push(patch.description); }
    if (patch.imageUrl !== undefined) { fields.push('image_url = ?'); values.push(patch.imageUrl); }
    if (patch.siteName !== undefined) { fields.push('site_name = ?'); values.push(patch.siteName); }
    if (fields.length === 0) return;
    values.push(id);
    db.prepare(`UPDATE moodboard_items SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteItem(id: string): void {
    db.prepare('DELETE FROM moodboard_items WHERE id = ?').run(id);
}

export function nextItemOrd(boardId: string): number {
    const row = db.prepare(
        'SELECT COALESCE(MAX(ord), -1) AS m FROM moodboard_items WHERE board_id = ?'
    ).get(boardId) as { m: number };
    return row.m + 1;
}
