import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getFontFile } from '@/lib/dal/fonts';

const CONTENT_TYPES: Record<string, string> = {
    woff2: 'font/woff2',
    woff:  'font/woff',
    ttf:   'font/ttf',
    otf:   'font/otf',
};

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { userId } = await auth();
    if (!userId) {
        return new NextResponse('Sign in required', { status: 401 });
    }

    const { id } = await params;
    const file = await getFontFile(userId, id);
    if (!file) {
        return new NextResponse('Font not found', { status: 404 });
    }

    const contentType = CONTENT_TYPES[file.format] ?? 'application/octet-stream';
    // Cast: Uint8Array IS valid BodyInit at runtime, but TS's recent strictness
    // around ArrayBufferLike vs ArrayBuffer makes the direct pass complain.
    return new NextResponse(file.data as unknown as BodyInit, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            // Per-user font assets — cache aggressively but keep them private.
            'Cache-Control': 'private, max-age=86400, must-revalidate',
        },
    });
}
