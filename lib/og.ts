// Lightweight server-side OpenGraph extractor.
// Regex-based for zero deps — adequate for cards, not a real HTML parser.

export interface OgMetadata {
    url: string;
    title: string;
    description: string;
    imageUrl: string;
    siteName: string;
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 800_000;

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';

function decodeHtmlEntities(s: string): string {
    return s
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

/** Read meta with attribute order tolerance. attrName is "property" or "name". */
function readMeta(html: string, attrName: 'property' | 'name', value: string): string | undefined {
    const tagRe = /<meta\b[^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(html)) !== null) {
        const tag = m[0];
        // Match attr regardless of order.
        const attrRe = new RegExp(`\\b${attrName}\\s*=\\s*["']${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i');
        if (!attrRe.test(tag)) continue;
        const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
        if (contentMatch) return decodeHtmlEntities(contentMatch[1].trim());
    }
    return undefined;
}

function readTitleTag(html: string): string | undefined {
    const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (!m) return undefined;
    return decodeHtmlEntities(m[1].replace(/\s+/g, ' ').trim());
}

/** Read either property= or name= for the same meta key, in that order. */
function readOg(html: string, key: string): string | undefined {
    return readMeta(html, 'property', key) ?? readMeta(html, 'name', key);
}

/** Look for an image_src <link>, e.g. <link rel="image_src" href="..."> */
function readImageSrcLink(html: string): string | undefined {
    const tagRe = /<link\b[^>]*>/gi;
    let m: RegExpExecArray | null;
    while ((m = tagRe.exec(html)) !== null) {
        const tag = m[0];
        if (!/\brel\s*=\s*["']image_src["']/i.test(tag)) continue;
        const hrefMatch = tag.match(/\bhref\s*=\s*["']([^"']*)["']/i);
        if (hrefMatch) return decodeHtmlEntities(hrefMatch[1].trim());
    }
    return undefined;
}

/** Walk every <script type="application/ld+json"> blob looking for an image URL. */
function readJsonLdImage(html: string): string | undefined {
    const re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
        const blob = m[1].trim();
        try {
            const parsed = JSON.parse(blob) as unknown;
            const found = findImageInJsonLd(parsed);
            if (found) return found;
        } catch {
            // Some sites concatenate multiple JSON objects — fall through.
        }
    }
    return undefined;
}

function findImageInJsonLd(node: unknown): string | undefined {
    if (!node) return undefined;
    if (typeof node === 'string') return undefined;
    if (Array.isArray(node)) {
        for (const item of node) {
            const found = findImageInJsonLd(item);
            if (found) return found;
        }
        return undefined;
    }
    if (typeof node !== 'object') return undefined;
    const obj = node as Record<string, unknown>;

    const img = obj.image;
    if (typeof img === 'string') return img;
    if (img && typeof img === 'object') {
        if (Array.isArray(img) && img.length > 0) {
            const first = img[0];
            if (typeof first === 'string') return first;
            if (first && typeof first === 'object') {
                const url = (first as Record<string, unknown>).url;
                if (typeof url === 'string') return url;
            }
        } else {
            const url = (img as Record<string, unknown>).url;
            if (typeof url === 'string') return url;
        }
    }

    // Recurse into nested entities (mainEntity, @graph, etc.)
    for (const v of Object.values(obj)) {
        const found = findImageInJsonLd(v);
        if (found) return found;
    }
    return undefined;
}

function safeUrl(href: string, base: string): string {
    try { return new URL(href, base).toString(); } catch { return ''; }
}

function hostnameOf(url: string): string {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

export async function fetchOgMetadata(rawUrl: string): Promise<OgMetadata> {
    let parsed: URL;
    try { parsed = new URL(rawUrl); } catch {
        throw new Error('That doesn’t look like a URL.');
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Only http and https URLs are supported.');
    }

    const fallback: OgMetadata = {
        url: parsed.toString(),
        title: hostnameOf(parsed.toString()),
        description: '',
        imageUrl: '',
        siteName: hostnameOf(parsed.toString()),
    };

    let res: Response;
    try {
        res = await fetch(parsed.toString(), {
            headers: {
                'User-Agent': UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
    } catch {
        // Network error / timeout — return URL-only card.
        return fallback;
    }

    const ct = res.headers.get('content-type') ?? '';
    if (!res.ok || !/text\/html|application\/xhtml/i.test(ct)) {
        // If the URL itself points at an image, use it directly.
        if (/^image\//i.test(ct)) {
            return { ...fallback, imageUrl: parsed.toString() };
        }
        return fallback;
    }

    // Read up to MAX_BYTES of HTML to keep things bounded.
    let html: string;
    try {
        const buf = await res.arrayBuffer();
        const slice = buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf;
        html = new TextDecoder('utf-8', { fatal: false }).decode(slice);
    } catch {
        return fallback;
    }

    const headEnd = html.search(/<\/head>/i);
    const head = headEnd > 0 ? html.slice(0, headEnd) : html;

    // Title: og:title (either attribute), twitter:title, then <title>.
    const ogTitle = readOg(head, 'og:title')
                 ?? readMeta(head, 'name', 'twitter:title')
                 ?? readMeta(head, 'property', 'twitter:title')
                 ?? readTitleTag(head);

    // Description: og:description, twitter:description, plain description.
    const ogDesc = readOg(head, 'og:description')
                ?? readMeta(head, 'name', 'twitter:description')
                ?? readMeta(head, 'property', 'twitter:description')
                ?? readMeta(head, 'name', 'description')
                ?? readMeta(head, 'property', 'description');

    // Image: try every common surface, then JSON-LD, then legacy image_src.
    const ogImage = readOg(head, 'og:image:secure_url')
                 ?? readOg(head, 'og:image')
                 ?? readMeta(head, 'name', 'twitter:image:src')
                 ?? readMeta(head, 'name', 'twitter:image')
                 ?? readMeta(head, 'property', 'twitter:image')
                 ?? readJsonLdImage(html)
                 ?? readImageSrcLink(head);

    const ogSite = readOg(head, 'og:site_name')
                ?? readMeta(head, 'name', 'application-name')
                ?? readMeta(head, 'property', 'application-name');

    // Site-specific fallbacks for hosts that intentionally hide their
    // OG tags from server-side fetchers.
    let resolvedImage = ogImage ? safeUrl(ogImage, parsed.toString()) : '';
    let resolvedTitle = ogTitle;
    let resolvedDesc = ogDesc;
    if (!resolvedImage) {
        const oembed = await trySiteOEmbed(parsed);
        if (oembed) {
            resolvedImage = oembed.thumbnailUrl ?? '';
            resolvedTitle = resolvedTitle ?? oembed.title;
            resolvedDesc  = resolvedDesc  ?? oembed.author;
        }
    }

    return {
        url: parsed.toString(),
        title: (resolvedTitle ?? hostnameOf(parsed.toString())).slice(0, 240),
        description: (resolvedDesc ?? '').slice(0, 600),
        imageUrl: resolvedImage,
        siteName: (ogSite ?? hostnameOf(parsed.toString())).slice(0, 120),
    };
}

// ── Site-specific oEmbed fallbacks ────────────────────────────────────────
// Several inspiration sources (Pinterest, Flickr, etc.) ship rich oEmbed
// endpoints that work even when their HTML pages are scraper-hostile.

interface OEmbedResult {
    thumbnailUrl?: string;
    title?: string;
    author?: string;
}

async function trySiteOEmbed(url: URL): Promise<OEmbedResult | undefined> {
    const host = url.hostname.toLowerCase();
    if (/(^|\.)pinterest\./.test(host)) {
        return fetchOEmbed(`https://www.pinterest.com/oembed.json?url=${encodeURIComponent(url.toString())}`);
    }
    if (/(^|\.)flickr\./.test(host)) {
        return fetchOEmbed(`https://www.flickr.com/services/oembed/?format=json&url=${encodeURIComponent(url.toString())}`);
    }
    return undefined;
}

async function fetchOEmbed(endpoint: string): Promise<OEmbedResult | undefined> {
    try {
        const res = await fetch(endpoint, {
            headers: {
                'User-Agent': UA,
                'Accept': 'application/json,text/javascript,*/*;q=0.5',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            redirect: 'follow',
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) return undefined;
        const ct = res.headers.get('content-type') ?? '';
        if (!/json|javascript/i.test(ct)) return undefined;
        const data = await res.json() as Record<string, unknown>;
        const thumb = data.thumbnail_url;
        const title = data.title;
        const author = data.author_name;
        return {
            thumbnailUrl: typeof thumb === 'string' ? thumb : undefined,
            title:        typeof title === 'string' ? title : undefined,
            author:       typeof author === 'string' ? author : undefined,
        };
    } catch {
        return undefined;
    }
}
