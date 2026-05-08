import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

declare global {
    var _devToolkitDb: ReturnType<typeof Database> | undefined;
}

function createSchema(db: ReturnType<typeof Database>) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS background_images (
            id       TEXT PRIMARY KEY,
            url      TEXT NOT NULL,
            label    TEXT NOT NULL DEFAULT '',
            added_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clipboard_tabs (
            id         TEXT PRIMARY KEY,
            title      TEXT NOT NULL,
            ord        INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS clipboard_content (
            tab_id  TEXT PRIMARY KEY REFERENCES clipboard_tabs(id) ON DELETE CASCADE,
            content TEXT NOT NULL DEFAULT ''
        );
        CREATE TABLE IF NOT EXISTS notes (
            id         TEXT PRIMARY KEY,
            title      TEXT NOT NULL,
            body       TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS moodboards (
            id         TEXT PRIMARY KEY,
            name       TEXT NOT NULL,
            ord        INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS moodboard_items (
            id          TEXT PRIMARY KEY,
            board_id    TEXT NOT NULL REFERENCES moodboards(id) ON DELETE CASCADE,
            url         TEXT NOT NULL,
            title       TEXT NOT NULL DEFAULT '',
            description TEXT NOT NULL DEFAULT '',
            image_url   TEXT NOT NULL DEFAULT '',
            site_name   TEXT NOT NULL DEFAULT '',
            ord         INTEGER NOT NULL DEFAULT 0,
            added_at    TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS moodboard_items_board ON moodboard_items(board_id);
    `);
}

function openDb(): ReturnType<typeof Database> {
    const dir = path.join(process.cwd(), 'data');
    fs.mkdirSync(dir, { recursive: true });
    const db = new Database(path.join(dir, 'dev-toolkit.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    createSchema(db);
    return db;
}

const db: ReturnType<typeof Database> = global._devToolkitDb ?? (global._devToolkitDb = openDb());
export default db;
