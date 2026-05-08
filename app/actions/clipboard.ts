'use server';

import { auth } from '@clerk/nextjs/server';
import {
    getClipboard, upsertTab, saveTabContent, deleteTab, setActiveTab,
    type ClipTab,
} from '@/lib/dal/clipboard';

async function requireUserId(): Promise<string> {
    const { userId } = await auth();
    if (!userId) throw new Error('Sign in to use the clipboard.');
    return userId;
}

export async function loadClipboardAction(): Promise<{ tabs: ClipTab[]; activeId: string }> {
    const userId = await requireUserId();
    return getClipboard(userId);
}

export async function upsertTabAction(tab: ClipTab): Promise<void> {
    const userId = await requireUserId();
    await upsertTab(userId, tab);
}

export async function saveTabContentAction(tabId: string, content: string): Promise<void> {
    const userId = await requireUserId();
    await saveTabContent(userId, tabId, content);
}

export async function deleteTabAction(id: string): Promise<void> {
    const userId = await requireUserId();
    await deleteTab(userId, id);
}

export async function setActiveTabAction(id: string): Promise<void> {
    const userId = await requireUserId();
    await setActiveTab(userId, id);
}
