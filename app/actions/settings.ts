'use server';

import { auth } from '@clerk/nextjs/server';
import { getSetting, setSetting } from '@/lib/dal/settings';

/** Returns null silently for anonymous users so public tools keep working. */
export async function getSettingAction(key: string): Promise<string | null> {
    const { userId } = await auth();
    if (!userId) return null;
    return getSetting(userId, key);
}

/** No-ops silently for anonymous users — they just don't get persistence. */
export async function setSettingAction(key: string, value: string): Promise<void> {
    const { userId } = await auth();
    if (!userId) return;
    await setSetting(userId, key, value);
}
