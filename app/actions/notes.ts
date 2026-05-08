'use server';

import { auth } from '@clerk/nextjs/server';
import { getNotes, createNote, deleteNote, type Note } from '@/lib/dal/notes';

async function requireUserId(): Promise<string> {
    const { userId } = await auth();
    if (!userId) throw new Error('Sign in to use notes.');
    return userId;
}

export async function getNotesAction(): Promise<Note[]> {
    const userId = await requireUserId();
    return getNotes(userId);
}

export async function createNoteAction(note: Note): Promise<void> {
    const userId = await requireUserId();
    await createNote(userId, note);
}

export async function deleteNoteAction(id: string): Promise<void> {
    const userId = await requireUserId();
    await deleteNote(userId, id);
}
