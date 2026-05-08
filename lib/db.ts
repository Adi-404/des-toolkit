import { createClient, type Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

declare global {
    var _desToolkitClient: Client | undefined;
    var _desToolkitSchema: Promise<void> | undefined;
}

function buildClient(): Client {
    // `??` only catches null/undefined; an empty string in .env.local would
    // pass through. `||` + `.trim()` is what we actually want here.
    const url = process.env.TURSO_DATABASE_URL?.trim() || buildLocalUrl();
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim() || undefined;
    return createClient({ url, authToken });
}

function buildLocalUrl(): string {
    // For local dev, ensure the data dir exists and use a file: libSQL URL.
    const dir = path.join(process.cwd(), 'data');
    fs.mkdirSync(dir, { recursive: true });
    return `file:${path.join(dir, 'des-toolkit.db')}`;
}

const SCHEMA = [
    // Per-user key-value preferences (color picker last value, diff text, etc.).
    // Anonymous reads/writes are no-ops at the action layer — table itself
    // requires a user_id row.
    `CREATE TABLE IF NOT EXISTS settings (
        user_id TEXT NOT NULL,
        key     TEXT NOT NULL,
        value   TEXT NOT NULL,
        PRIMARY KEY (user_id, key)
    )`,

    // Clipboard tabs — each user has their own tabs.
    `CREATE TABLE IF NOT EXISTS clipboard_tabs (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        title      TEXT NOT NULL,
        ord        INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS clipboard_tabs_user ON clipboard_tabs(user_id)`,
    `CREATE TABLE IF NOT EXISTS clipboard_content (
        tab_id  TEXT PRIMARY KEY REFERENCES clipboard_tabs(id) ON DELETE CASCADE,
        content TEXT NOT NULL DEFAULT ''
    )`,

    // Notes-pad scratchpad notes.
    `CREATE TABLE IF NOT EXISTS notes (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        title      TEXT NOT NULL,
        body       TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS notes_user ON notes(user_id)`,

    // Moodboard pins, flat across boards (boards UI was removed).
    `CREATE TABLE IF NOT EXISTS moodboard_items (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        url         TEXT NOT NULL,
        title       TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        image_url   TEXT NOT NULL DEFAULT '',
        site_name   TEXT NOT NULL DEFAULT '',
        added_at    TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS moodboard_items_user ON moodboard_items(user_id)`,

    // iOS-style colour tags.
    `CREATE TABLE IF NOT EXISTS moodboard_tags (
        id         TEXT PRIMARY KEY,
        user_id    TEXT NOT NULL,
        name       TEXT NOT NULL,
        color      TEXT NOT NULL DEFAULT 'pink',
        ord        INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS moodboard_tags_user ON moodboard_tags(user_id)`,

    // Item ↔ tag join. user_id is implicit via the parent rows; we just need
    // the FKs to cascade-delete properly.
    `CREATE TABLE IF NOT EXISTS moodboard_item_tags (
        item_id TEXT NOT NULL REFERENCES moodboard_items(id) ON DELETE CASCADE,
        tag_id  TEXT NOT NULL REFERENCES moodboard_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (item_id, tag_id)
    )`,
    `CREATE INDEX IF NOT EXISTS moodboard_item_tags_tag ON moodboard_item_tags(tag_id)`,

    // ── fontbook ──────────────────────────────────────────────────────────
    // A font is either a hosted reference (source_url + family + format='google'|'link')
    // or a raw uploaded file (data BLOB + format = 'woff2'|'woff'|'ttf'|'otf').
    `CREATE TABLE IF NOT EXISTS fonts (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL,
        family        TEXT NOT NULL,
        source_url    TEXT NOT NULL DEFAULT '',
        source_label  TEXT NOT NULL DEFAULT '',
        format        TEXT NOT NULL DEFAULT 'link',
        file_name     TEXT NOT NULL DEFAULT '',
        data          BLOB,
        added_at      TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS fonts_user ON fonts(user_id)`,
];

async function applySchema(client: Client): Promise<void> {
    // Foreign keys aren't enforced by default on libSQL; turn them on
    // before running any DDL so the FKs above actually cascade.
    await client.execute('PRAGMA foreign_keys = ON');
    for (const stmt of SCHEMA) {
        await client.execute(stmt);
    }
}

/** Get the libSQL client, ensuring schema has been applied. */
export async function db(): Promise<Client> {
    const client = global._desToolkitClient ?? (global._desToolkitClient = buildClient());
    if (!global._desToolkitSchema) {
        global._desToolkitSchema = applySchema(client).catch((err) => {
            // Reset on failure so a retry can re-attempt the schema apply.
            global._desToolkitSchema = undefined;
            throw err;
        });
    }
    await global._desToolkitSchema;
    return client;
}
