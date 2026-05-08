// Shared types + the TAG_COLORS palette. Imported by both server (DAL,
// actions) and client (Moodboard component) so it MUST NOT pull in
// any Node-only deps — keep this file free of `fs`, `better-sqlite3`,
// and anything from `lib/db.ts`.

export const TAG_COLORS = [
    'pink', 'teal', 'lavender', 'peach', 'ochre', 'mint', 'coral', 'slate',
] as const;

export type TagColor = (typeof TAG_COLORS)[number];

export interface Tag {
    id: string;
    name: string;
    color: TagColor;
    ord: number;
    createdAt: string;
}

export interface PinItem {
    id: string;
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    siteName: string;
    addedAt: string;
    tagIds: string[];
}
