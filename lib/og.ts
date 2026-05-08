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

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15 desToolkitOG/1.0';

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
                'Accept': 'text/html,application/xhtml+xml',
                'Accept-Language': 'en',
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

    const ogTitle = readMeta(head, 'property', 'og:title')
                 ?? readMeta(head, 'name', 'twitter:title')
                 ?? readTitleTag(head);

    const ogDesc = readMeta(head, 'property', 'og:description')
                ?? readMeta(head, 'name', 'twitter:description')
                ?? readMeta(head, 'name', 'description');

    const ogImage = readMeta(head, 'property', 'og:image:secure_url')
                 ?? readMeta(head, 'property', 'og:image')
                 ?? readMeta(head, 'name', 'twitter:image:src')
                 ?? readMeta(head, 'name', 'twitter:image');

    const ogSite = readMeta(head, 'property', 'og:site_name')
                ?? readMeta(head, 'name', 'application-name');

    return {
        url: parsed.toString(),
        title: (ogTitle ?? hostnameOf(parsed.toString())).slice(0, 240),
        description: (ogDesc ?? '').slice(0, 600),
        imageUrl: ogImage ? safeUrl(ogImage, parsed.toString()) : '',
        siteName: (ogSite ?? hostnameOf(parsed.toString())).slice(0, 120),
    };
}
