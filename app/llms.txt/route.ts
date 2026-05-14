/**
 * Emerging "llms.txt" convention (https://llmstxt.org) — a plain-text
 * summary of the site that's friendly for LLM crawlers. Helps ChatGPT
 * search, Perplexity, Claude, etc. understand what this site does and
 * where the canonical pages live, without parsing the whole DOM.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const BODY = `# des/toolkit

> A warm, browser-based workshop for designers and frontend developers.
> Save inspiration on a moodboard, build a personal type library in the
> fontbook, and reach for small dev utilities — all in one tab. Built with
> Next.js, runs entirely in the browser for tool work; per-user data is
> stored in Turso/libSQL.

## Headline surfaces

- [Moodboard](${SITE_URL}/moodboard): Save links and images from anywhere — Pinterest, Dribbble, Behance — with iOS-style colour tags and a bento-grid layout. Per-user.
- [Fontbook](${SITE_URL}/fonts): Browse 65+ curated Google Fonts, paste foundry URLs, or upload .woff2/.woff/.ttf/.otf files. Each card renders the family live.
- [Settings](${SITE_URL}/settings): Per-account preferences — keyboard shortcuts, right-click wheel, tool order, moodboard tile density.

## Design tools

- [Contrast checker](${SITE_URL}/color/contrast): WCAG 2.1 contrast ratios + colour-blindness simulation.
- [Palette extractor](${SITE_URL}/color/palette): Drop an image, pull dominant colours, export as hex / CSS vars / Tailwind.
- [Cubic-bezier studio](${SITE_URL}/css/bezier): Design an easing curve with a live animated preview, copy the CSS.
- [Token translator](${SITE_URL}/assets/tokens): Translate colour tokens between CSS variables, Tailwind config, and W3C tokens.json.
- [SVG viewer](${SITE_URL}/assets/svg): Render SVG, inspect dimensions, strip editor namespaces.
- [Image toolkit](${SITE_URL}/assets/image): Base64, dimensions, favicon set generator — all canvas-side.

## Code and utility tools

- [Diff checker](${SITE_URL}/diff): Side-by-side text diff with sync-scroll and merge buttons.
- [JSON formatter](${SITE_URL}/json-formatter): Format, validate, sort keys, minify, tree-view.
- [Markdown preview](${SITE_URL}/markdown-preview): Two-pane GFM editor.
- [CSV viewer](${SITE_URL}/csv-viewer): Parse, sort, search, export CSV in-browser.
- [JWT decoder](${SITE_URL}/jwt-decoder): Decode JWT header + payload claims.
- [Clipboard](${SITE_URL}/clipboard): Tabbed scratchpad with line numbers, saved per user.
- [Notes pad](${SITE_URL}/notes-pad): Personal scratchpad notes, per user.
- [Pomodoro](${SITE_URL}/pomodoro): Focus timer with optional posture check.
- [Paste & compare](${SITE_URL}/compare): Render two HTML/CSS snippets in side-by-side sandboxed iframes.

## Keyboard shortcuts

- \`Cmd/Ctrl + K\` — open command palette (search all tools).
- \`Alt\` (hold) — summon the radial tool wheel at the cursor.
- \`Shift + ?\` — open the cheatsheet of all shortcuts.
- \`g\` then \`h\`/\`m\`/\`f\`/\`s\`/\`c\`/\`n\`/\`d\`/\`j\`/\`k\`/\`p\` — quick-jump to home, moodboard, fonts, settings, clipboard, notes, diff, JSON, markdown, pomodoro.

## Privacy

All tool work happens in the browser. Persistence for moodboard, fontbook, clipboard tabs, notes, and settings is per-user, stored against a Clerk-issued user id. Uploads are capped at 1 MB.

## Source

- GitHub: https://github.com/Adi-404/des-toolkit
- Maintainer: https://github.com/Adi-404
`;

export async function GET() {
    return new Response(BODY, {
        headers: {
            'content-type': 'text/plain; charset=utf-8',
            // Static-ish content. Edge can cache aggressively, but a fresh
            // crawl every 10 minutes is fine for a site this size.
            'cache-control': 'public, max-age=600, s-maxage=600',
        },
    });
}
