import { NextResponse } from 'next/server';

// Gemini flash image generation uses :generateContent.
// Imagen models (imagen-3.*) use :generateImages but require Vertex AI / allowlist access.
// Set GEMINI_IMAGE_MODEL env var to override.
const DEFAULT_MODEL = 'gemini-2.0-flash-exp-image-generation';
const ALLOWED_ASPECT = new Set(['1:1', '3:4', '4:3', '9:16', '16:9']);

// ── Response shapes ──────────────────────────────────────────────────────────

interface ImagenResponse {
    generatedImages?: { image?: { imageBytes?: string; mimeType?: string } }[];
    error?: { message?: string };
}

interface GeminiResponse {
    candidates?: {
        content?: {
            parts?: { inlineData?: { data?: string; mimeType?: string } }[];
        };
    }[];
    error?: { message?: string; status?: string };
}

// ────────────────────────────────────────────────────────────────────────────

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
    const isImagenModel = model.startsWith('imagen-');

    const base = 'https://generativelanguage.googleapis.com/v1beta/models';

    // ── Imagen models use :generateImages ────────────────────────────────────
    if (isImagenModel) {
        const url = `${base}/${model}:generateImages?key=${encodeURIComponent(apiKey)}`;
        const payload = {
            prompt,
            number_of_images: 1,
            aspect_ratio: aspect,
            person_generation: 'ALLOW_ADULT',
            safety_filter_level: 'BLOCK_SOME',
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

        const imageBytes = parsed.generatedImages?.[0]?.image?.imageBytes;
        const mimeType = parsed.generatedImages?.[0]?.image?.mimeType ?? 'image/png';

        if (!imageBytes) {
            return NextResponse.json(
                { error: 'no_image', message: 'Imagen did not return image data — the prompt may have been blocked by safety filters.' },
                { status: 502 },
            );
        }

        return NextResponse.json({ image: imageBytes, mimeType, model, aspectRatio: aspect });
    }

    // ── Gemini flash models use :generateContent ──────────────────────────────
    const url = `${base}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
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

    let parsed: GeminiResponse;
    try {
        parsed = (await upstream.json()) as GeminiResponse;
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
                message: parsed.error?.message ?? `Gemini returned status ${upstream.status}.`,
            },
            { status },
        );
    }

    const imagePart = parsed.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
        return NextResponse.json(
            { error: 'no_image', message: 'Gemini did not return image data — the prompt may have been blocked by safety filters.' },
            { status: 502 },
        );
    }

    return NextResponse.json({
        image: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType ?? 'image/png',
        model,
        aspectRatio: aspect,
    });
}
