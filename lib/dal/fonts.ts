import { db } from '../db';

export type FontFormat = 'google' | 'link' | 'woff2' | 'woff' | 'ttf' | 'otf';

export interface FontRecord {
    id: string;
    family: string;
    sourceUrl: string;
    sourceLabel: string;
    format: FontFormat;
    fileName: string;
    addedAt: string;
    /** True if a BLOB is stored — clients use it to know whether to fetch
     *  the binary via /api/fonts/[id]. */
    hasFile: boolean;
}

export interface NewFontInput {
    id: string;
    userId: string;
    family: string;
    sourceUrl: string;
    sourceLabel: string;
    format: FontFormat;
    fileName: string;
    data: Uint8Array | null;
    addedAt: string;
}

export async function listFonts(userId: string): Promise<FontRecord[]> {
    const client = await db();
    const res = await client.execute({
        sql: `SELECT id, family, source_url AS sourceUrl, source_label AS sourceLabel,
                     format, file_name AS fileName, added_at AS addedAt,
                     CASE WHEN data IS NULL THEN 0 ELSE 1 END AS hasFile
              FROM fonts
              WHERE user_id = ?
              ORDER BY added_at DESC`,
        args: [userId],
    });
    return res.rows.map((r) => ({
        id: String(r.id),
        family: String(r.family),
        sourceUrl: String(r.sourceUrl ?? ''),
        sourceLabel: String(r.sourceLabel ?? ''),
        format: String(r.format ?? 'link') as FontFormat,
        fileName: String(r.fileName ?? ''),
        addedAt: String(r.addedAt),
        hasFile: Number(r.hasFile) === 1,
    }));
}

export async function addFont(input: NewFontInput): Promise<void> {
    const client = await db();
    await client.execute({
        sql: `INSERT INTO fonts
                (id, user_id, family, source_url, source_label, format, file_name, data, added_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
            input.id,
            input.userId,
            input.family,
            input.sourceUrl,
            input.sourceLabel,
            input.format,
            input.fileName,
            input.data,
            input.addedAt,
        ],
    });
}

export async function deleteFont(userId: string, id: string): Promise<void> {
    const client = await db();
    await client.execute({
        sql: 'DELETE FROM fonts WHERE id = ? AND user_id = ?',
        args: [id, userId],
    });
}

/** Returns the raw font bytes + format for the API route to stream. */
export async function getFontFile(
    userId: string,
    id: string,
): Promise<{ data: Uint8Array; format: FontFormat } | null> {
    const client = await db();
    const res = await client.execute({
        sql: 'SELECT data, format FROM fonts WHERE id = ? AND user_id = ?',
        args: [id, userId],
    });
    const row = res.rows[0];
    if (!row || row.data === null || row.data === undefined) return null;
    const data = row.data as ArrayBuffer | Uint8Array;
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    return { data: bytes, format: String(row.format) as FontFormat };
}
