'use server';

import {
    listBoards, getBoard, createBoard, renameBoard, deleteBoard,
    getItems, addItem, updateItem, deleteItem, nextItemOrd,
    type Board, type BoardItem, type BoardWithCount,
} from '@/lib/dal/moodboard';
import { fetchOgMetadata } from '@/lib/og';

function uid(): string {
    return crypto.randomUUID();
}

function nowIso(): string {
    return new Date().toISOString();
}

// ── Boards ──

export async function listBoardsAction(): Promise<BoardWithCount[]> {
    return listBoards();
}

export async function getBoardAction(id: string): Promise<Board | null> {
    return getBoard(id);
}

export async function createBoardAction(name: string): Promise<Board> {
    const trimmed = name.trim() || 'Untitled board';
    const board: Board = {
        id: uid(),
        name: trimmed.slice(0, 80),
        ord: listBoards().length,
        createdAt: nowIso(),
    };
    createBoard(board);
    return board;
}

export async function renameBoardAction(id: string, name: string): Promise<void> {
    renameBoard(id, name.trim().slice(0, 80) || 'Untitled board');
}

export async function deleteBoardAction(id: string): Promise<void> {
    deleteBoard(id);
}

// ── Items ──

export async function getItemsAction(boardId: string): Promise<BoardItem[]> {
    return getItems(boardId);
}

export interface AddLinkResult {
    item: BoardItem;
    /** True if OG metadata was successfully extracted (vs. URL-only fallback). */
    enriched: boolean;
}

export async function addLinkAction(boardId: string, url: string): Promise<AddLinkResult> {
    if (!getBoard(boardId)) throw new Error('Board not found.');

    const og = await fetchOgMetadata(url);
    const enriched = Boolean(og.imageUrl || og.description);

    const item: BoardItem = {
        id: uid(),
        boardId,
        url: og.url,
        title: og.title,
        description: og.description,
        imageUrl: og.imageUrl,
        siteName: og.siteName,
        ord: nextItemOrd(boardId),
        addedAt: nowIso(),
    };
    addItem(item);
    return { item, enriched };
}

export async function updateItemAction(
    id: string,
    patch: Partial<Pick<BoardItem, 'title' | 'description' | 'imageUrl' | 'siteName'>>,
): Promise<void> {
    updateItem(id, patch);
}

export async function deleteItemAction(id: string): Promise<void> {
    deleteItem(id);
}

/** Re-fetch OG metadata for an existing item — useful when a site's preview improves. */
export async function refreshItemAction(id: string, url: string, boardId: string): Promise<BoardItem> {
    const og = await fetchOgMetadata(url);
    updateItem(id, {
        title: og.title,
        description: og.description,
        imageUrl: og.imageUrl,
        siteName: og.siteName,
    });
    const item = getItems(boardId).find((i) => i.id === id);
    if (!item) throw new Error('Item not found.');
    return item;
}
