/**
 * Defensive resolver for the public site URL.
 *
 * `NEXT_PUBLIC_SITE_URL` is plumbed into metadataBase, the sitemap, the
 * robots file, llms.txt, and the OG image. Every consumer expects a valid
 * absolute URL — and historically a typo in the Vercel env field (e.g.
 * pasting "NEXT_PUBLIC_SITE_URL=https://…" instead of just the URL) has
 * blown up the entire build with `new URL(...)` → `TypeError: Invalid URL`.
 *
 * This helper does the parse once, tolerates a few common foot-guns
 * (KEY=VALUE pasted, leading/trailing whitespace, trailing slash), and
 * falls back to localhost on anything else so the build keeps going.
 */

const FALLBACK = 'http://localhost:3000';

function sanitize(raw: string | undefined): string {
    if (!raw) return FALLBACK;
    let v = raw.trim();
    if (!v) return FALLBACK;
    // Common foot-gun: pasting the whole `KEY=VALUE` line into the value
    // field of a hosting dashboard. Strip a leading `KEY=` if present.
    const eq = v.indexOf('=');
    if (eq !== -1 && /^[A-Z_][A-Z0-9_]*=/.test(v)) {
        v = v.slice(eq + 1).trim();
    }
    // Drop a trailing slash so concatenations don't double up.
    if (v.endsWith('/')) v = v.slice(0, -1);
    try {
        // Reject anything that isn't a real absolute URL.
        new URL(v);
        return v;
    } catch {
        return FALLBACK;
    }
}

export const SITE_URL = sanitize(process.env.NEXT_PUBLIC_SITE_URL);
