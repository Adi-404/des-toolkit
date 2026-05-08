import { NextResponse } from 'next/server';

// Imagen 3 by default — override with GEMINI_IMAGE_MODEL if needed.
const DEFAULT_MODEL = 'imagen-3.0-generate-002';
const ALLOWED_ASPECT = new Set(['1:1', '3:4', '4:3', '9:16', '16:9']);

interface ImagenPrediction {
    bytesBase64Encoded?: string;
    mimeType?: string;
}

interface ImagenResponse {
    predictions?: ImagenPrediction[];
    error?: { message?: string; status?: string };
}

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            {
                error: 'missing_key',
                message: 'GEMINI_API_KEY is not set on the server. Add it to .env.local and restart `next dev`.',
            },
            { status: 503 },
        );
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'invalid_body', message: 'Body must be JSON.' }, { status: 400 });
    }

    const { prompt, aspectRatio } = (body ?? {}) as { prompt?: unknown; aspectRatio?: unknown };
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
        return NextResponse.json({ error: 'invalid_prompt', message: 'Prompt is required.' }, { status: 400 });
    }
    if (prompt.length > 4000) {
        return NextResponse.json({ error: 'prompt_too_long', message: 'Prompt must be ≤ 4000 chars.' }, { status: 400 });
    }

    const aspect = typeof aspectRatio === 'string' && ALLOWED_ASPECT.has(aspectRatio) ? aspectRatio : '1:1';
    const model = process.env.GEMINI_IMAGE_MODEL || DEFAULT_MODEL;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${encodeURIComponent(apiKey)}`;
    const payload = {
        instances: [{ prompt }],
        parameters: {
            sampleCount: 1,
            aspectRatio: aspect,
            personGeneration: 'allow_adult',
        },
    };

    let upstream: Response;
    try {
        upstream = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        return NextResponse.json(
            { error: 'network_error', message: err instanceof Error ? err.message : 'Network request failed.' },
            { status: 502 },
        );
    }

    let parsed: ImagenResponse;
    try {
        parsed = (await upstream.json()) as ImagenResponse;
    } catch {
        return NextResponse.json(
            { error: 'invalid_upstream', message: `Upstream returned a non-JSON response (status ${upstream.status}).` },
            { status: 502 },
        );
    }

    if (!upstream.ok || parsed.error) {
        const status = upstream.status === 401 || upstream.status === 403 ? 401 : 502;
        return NextResponse.json(
            {
                error: 'upstream_error',
                upstreamStatus: upstream.status,
                message: parsed.error?.message ?? `Imagen returned status ${upstream.status}.`,
            },
            { status },
        );
    }

    const prediction = parsed.predictions?.[0];
    if (!prediction?.bytesBase64Encoded) {
        return NextResponse.json(
            { error: 'no_image', message: 'Imagen did not return image data — the prompt may have been blocked by safety filters.' },
            { status: 502 },
        );
    }

    return NextResponse.json({
        image: prediction.bytesBase64Encoded,
        mimeType: prediction.mimeType ?? 'image/png',
        model,
        aspectRatio: aspect,
    });
}
