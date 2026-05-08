import { NextResponse } from 'next/server';

const ALLOWED_ASPECT = new Set(['1:1', '3:4', '4:3', '9:16', '16:9']);

// ── Model auto-discovery ─────────────────────────────────────────────────────
// Cache survives across warm invocations; resets on cold start.
let _cachedModel: string | null = null;

interface ModelEntry {
    name: string;
    supportedGenerationMethods?: string[];
}

async function resolveModel(apiKey: string): Promise<string> {
    // Explicit override always wins.
    const override = process.env.GEMINI_IMAGE_MODEL?.trim();
    if (override) return override;

    if (_cachedModel) return _cachedModel;

    // Fetch the full model list and pick the best image-generation candidate.
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`,
    );
    if (!res.ok) throw new Error(`ListModels failed with status ${res.status}`);

    const data = (await res.json()) as { models?: ModelEntry[] };
    const models: ModelEntry[] = data.models ?? [];

    // Priority: flash image-generation model > any model whose name contains "image"
    const pick =
        models.find(m =>
            m.supportedGenerationMethods?.includes('generateContent') &&
            /flash.*image|image.*flash/i.test(m.name),
        ) ??
        models.find(m =>
            m.supportedGenerationMethods?.includes('generateContent') &&
            /image/i.test(m.name),
        );

    if (!pick) {
        // Surface available models to help the developer choose.
        const names = models
            .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
            .map(m => m.name)
            .join(', ');
        throw new Error(
            `No image-generation model found. Set GEMINI_IMAGE_MODEL to one of: ${names || '(none)'}`,
        );
    }

    _cachedModel = pick.name.replace('models/', '');
    return _cachedModel;
}

// ── Response shapes ──────────────────────────────────────────────────────────

interface GeminiResponse {
    candidates?: {
        content?: {
            parts?: { inlineData?: { data?: string; mimeType?: string }; text?: string }[];
        };
    }[];
    error?: { message?: string; status?: string };
}

interface ImagenResponse {
    generatedImages?: { image?: { imageBytes?: string; mimeType?: string } }[];
    error?: { message?: string };
}

// ── Handlers ─────────────────────────────────────────────────────────────────

/** GET /api/gemini — lists available image-generation models (for debugging). */
export async function GET() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 503 });
    }
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}&pageSize=200`,
        );
        const data = (await res.json()) as { models?: ModelEntry[] };
        const imageCandidates = (data.models ?? [])
            .filter(m => /image/i.test(m.name))
            .map(m => ({ name: m.name, methods: m.supportedGenerationMethods }));
        return NextResponse.json({ imageCandidates, total: data.models?.length });
    } catch (err) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            {
                error: 'missing_key',
                message: 'GEMINI_API_KEY is not set. Add it to .env.local and restart.',
            },
            { status: 503 },
        );
    }

    let body: unknown;
    try { body = await request.json(); } catch {
        return NextResponse.json({ error: 'invalid_body', message: 'Body must be JSON.' }, { status: 400 });
    }

    const { prompt, aspectRatio } = (body ?? {}) as { prompt?: unknown; aspectRatio?: unknown };
    if (typeof prompt !== 'string' || !prompt.trim()) {
        return NextResponse.json({ error: 'invalid_prompt', message: 'Prompt is required.' }, { status: 400 });
    }
    if (prompt.length > 4000) {
        return NextResponse.json({ error: 'prompt_too_long', message: 'Prompt must be ≤ 4000 chars.' }, { status: 400 });
    }

    const aspect = typeof aspectRatio === 'string' && ALLOWED_ASPECT.has(aspectRatio) ? aspectRatio : '1:1';

    let model: string;
    try {
        model = await resolveModel(apiKey);
    } catch (err) {
        return NextResponse.json(
            { error: 'no_model', message: err instanceof Error ? err.message : String(err) },
            { status: 503 },
        );
    }

    const base = 'https://generativelanguage.googleapis.com/v1beta/models';
    const isImagenModel = model.startsWith('imagen-');

    // ── Imagen models (:generateImages) ──────────────────────────────────────
    if (isImagenModel) {
        const url = `${base}/${model}:generateImages?key=${encodeURIComponent(apiKey)}`;
        const payload = {
            prompt, number_of_images: 1, aspect_ratio: aspect,
            person_generation: 'ALLOW_ADULT', safety_filter_level: 'BLOCK_SOME',
        };

        let upstream: Response;
        try { upstream = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
        catch (err) { return NextResponse.json({ error: 'network_error', message: String(err) }, { status: 502 }); }

        let parsed: ImagenResponse;
        try { parsed = await upstream.json() as ImagenResponse; }
        catch { return NextResponse.json({ error: 'invalid_upstream', message: `Status ${upstream.status}, non-JSON body.` }, { status: 502 }); }

        if (!upstream.ok || parsed.error) {
            _cachedModel = null; // clear cache so next call retries discovery
            return NextResponse.json(
                { error: 'upstream_error', message: parsed.error?.message ?? `Status ${upstream.status}` },
                { status: upstream.status === 401 || upstream.status === 403 ? 401 : 502 },
            );
        }

        const imageBytes = parsed.generatedImages?.[0]?.image?.imageBytes;
        if (!imageBytes) return NextResponse.json({ error: 'no_image', message: 'No image returned — prompt may be blocked.' }, { status: 502 });
        return NextResponse.json({ image: imageBytes, mimeType: parsed.generatedImages?.[0]?.image?.mimeType ?? 'image/png', model, aspectRatio: aspect });
    }

    // ── Gemini models (:generateContent) ─────────────────────────────────────
    const url = `${base}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] },
    };

    let upstream: Response;
    try { upstream = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
    catch (err) { return NextResponse.json({ error: 'network_error', message: String(err) }, { status: 502 }); }

    let parsed: GeminiResponse;
    try { parsed = await upstream.json() as GeminiResponse; }
    catch { return NextResponse.json({ error: 'invalid_upstream', message: `Status ${upstream.status}, non-JSON body.` }, { status: 502 }); }

    if (!upstream.ok || parsed.error) {
        _cachedModel = null; // clear cache on failure so discovery re-runs
        return NextResponse.json(
            { error: 'upstream_error', message: parsed.error?.message ?? `Status ${upstream.status}` },
            { status: upstream.status === 401 || upstream.status === 403 ? 401 : 502 },
        );
    }

    const imagePart = parsed.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
        return NextResponse.json({ error: 'no_image', message: 'No image returned — prompt may be blocked by safety filters.' }, { status: 502 });
    }

    return NextResponse.json({
        image: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType ?? 'image/png',
        model,
        aspectRatio: aspect,
    });
}
