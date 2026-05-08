# des/toolkit

A warm, browser-based workshop of design + frontend tools, with a moodboard
to keep your inspiration in one place. Built on Next.js with libSQL persistence
and a coherent design system ("Clay") across every tool.

```
des/toolkit
├── 22 tools across 6 labs
├── Moodboard with OG-fetched preview cards + iOS-style tags
└── Single warm cream canvas, Inter typography
```

## Quick start

```bash
cp .env.local.example .env.local
# Fill in the Clerk keys at minimum; everything else can be left blank for local dev.
npm install
npm run dev
```

Open <http://localhost:3000>. The dev DB lives at `data/des-toolkit.db`
(gitignored, libSQL file backend, created on first run).

### Required environment

| Variable | Where to get it | Notes |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk dashboard → API keys](https://dashboard.clerk.com/last-active?path=api-keys) | Public, safe to ship to the browser |
| `CLERK_SECRET_KEY` | Same page, "Show secret" | **Server-only** — never paste in chat or commit |
| `TURSO_DATABASE_URL` | Optional in dev (defaults to a local file) — required in prod | `libsql://…` for prod, `file:…` locally |
| `TURSO_AUTH_TOKEN` | Required when `TURSO_DATABASE_URL` is a remote `libsql://` URL | |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) — only if you want `/gemini` | |

Auth scope: only the persistence routes (`/moodboard`, `/clipboard`,
`/notes-pad`, `/notes/*`) require sign-in. Every other tool stays public.

## Deploying to Vercel

1. **Create the Turso database**
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash   # one-time install
   turso auth signup
   turso db create des-toolkit
   turso db show des-toolkit --url     # → TURSO_DATABASE_URL
   turso db tokens create des-toolkit  # → TURSO_AUTH_TOKEN
   ```
2. **Push the repo to GitHub**, then **import it on Vercel** (Add New → Project).
3. **Set environment variables** in Vercel project settings:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`
   - Optional: `GEMINI_API_KEY`, the four `NEXT_PUBLIC_CLERK_*_URL` vars from
     `.env.local.example` (recommended so sign-in stays on your domain).
4. **Configure Clerk for your prod domain** — in the Clerk dashboard under
   "Domains", add your Vercel URL (and your custom domain if any).
5. Push to `main` — Vercel will build and deploy. The libSQL schema applies
   itself on the first request via a top-of-module migration.

## What's inside

### Inspiration

| Path | What it does |
|---|---|
| **/moodboard** | Bento grid of saved links and uploaded pictures. Paste a URL (we fetch og:image / og:title / og:description), drop an image file (saved as a base64 data URL), or both. Tag with iOS-style colour pills, filter the grid by selected tags, refresh per-card preview, click out to source. |
| **/fonts** | **fontbook** — search a curated catalog of ~65 Google Fonts and click to save, paste a Google Fonts URL, paste a foundry link as a reference, or upload your own `.woff2` / `.woff` / `.ttf` / `.otf` (registered via `@font-face` against `/api/fonts/[id]`). Every card renders the family live. |

### Design tools

For the moments when Figma is overkill — quick reference utilities that all end in copyable CSS or JSON.

| Path | What it does |
|---|---|
| **/color/contrast** | WCAG 2.1 contrast ratio for any foreground/background pair, with AA/AAA badges for both small and large text. Plus a 4-up colour-blindness preview (deuteranopia, protanopia, tritanopia, achromatopsia) with per-kind contrast recompute. |
| **/css/bezier** | Drag two SVG control handles to design an easing curve. Live motion preview animates a dot using your curve via Newton-Raphson `tForX`. Six named presets including a spring-back overshoot. |
| **/assets/tokens** | Translate colour tokens between CSS variables, Tailwind config, and W3C `tokens.json`. Auto-detects input format. Loose-JSON parser handles unquoted keys + trailing commas. Status row shows token count + a swatch preview strip. |
| **/assets/svg** | Render any SVG over a transparent checker (light + dark canvas). Light optimizer strips XML decl, comments, metadata/title/desc, Adobe/Sketch/Inkscape namespaces and rounds long decimals. Live byte-savings counter. |
| **/assets/image** | Drop an image to read MIME type, size, dimensions, aspect ratio. Copy the full base64 data URL. Generate a complete favicon raster set at 16/32/48/64/128/192/512 (canvas-rendered with letterboxing). |
| **/gemini** | Prompt → image via Google Imagen on the Gemini API. 5 aspect ratios. Server-side key handling — your `GEMINI_API_KEY` never leaves the server. |

### Code & utility

| Path | What it does |
|---|---|
| **/diff** | Side-by-side text diff with character-level highlights, line-pair merge buttons (← →), optional sync-scroll. |
| **/json-formatter** | Format / validate / minify / tree-view JSON. Auto-decodes URL-encoded and Base64-wrapped JSON. Tree view with hover-path display, search, expand/collapse all, sort keys, indent toggle. |
| **/compare** | Two-pane HTML/CSS playground; each pane drives a sandboxed iframe via `srcDoc`. Layout toggle, viewport simulation, optional sync-scroll. |
| **/markdown-preview** | Live two-pane GitHub-flavored markdown editor; persistent input; light `oneLight` syntax highlighting on cream code surfaces. |
| **/clipboard** | Tabbed scratchpad with line numbers, persistent across sessions. Rename tabs, close tabs, copy / clear all. |
| **/download** | One-keystroke save of whatever's on your clipboard — text or image. ⌘V to read; PNG/JPG/GIF/WebP support. |
| **/csv-viewer** | Parse, sort, search and export CSV in the browser. |
| **/jwt-decoder** | Decode and inspect JWT header + payload claims. |
| **/pomodoro** | Focus timer with optional TensorFlow.js posture monitoring on webcam. |
| **/notes-pad** | Personal scratchpad notes. |
| **/notes/[topic]** | Renders external markdown notes from the `dev-diary` repo. |

## Keyboard shortcuts

- **⌘K / Ctrl-K** — open the command palette to search any tool
- **Esc** — close the palette
- **↑ ↓** — navigate palette results
- **↵** — open the highlighted tool

## Stack

- **Next.js 16** (App Router, Turbopack)
- **React 19** with Server Actions
- **TypeScript**
- **Tailwind CSS v4** (PostCSS) + CSS Modules
- **Clerk** (`@clerk/nextjs`) for auth — only the persistence routes
  (`/moodboard`, `/fonts`, `/clipboard`, `/notes-pad`, `/notes/*`) are gated;
  every other tool stays public.
- **libSQL** via `@libsql/client` for persistence — local dev uses a `file:`
  URL (`data/des-toolkit.db`); production points at Turso.
- **motion** for the home/sign-in animated demo + sign-up marquee
- **diff-match-patch** for the diff tool
- **react-markdown** + **remark-gfm** for markdown rendering
- **react-syntax-highlighter** (Prism) for code blocks
- **TensorFlow.js** + **MobileNet** + **KNN classifier** (lazy-loaded) for the
  Pomodoro posture detector

## Design system — "Clay"

Every Clay-styled tool reads on a cream `#fffaf0` canvas, with Inter for
text and a six-colour saturated palette for feature cards (pink, teal,
lavender, peach, ochre, cream). See [Design.md](./Design.md) for the
full token spec.

## Project layout

```
app/                     Next.js routes (one folder per tool)
  api/gemini/            Server route for Imagen
  actions/               'use server' RPC wrappers around the DAL
components/              All tool components + .module.css siblings
lib/
  db.ts                  SQLite open + schema
  dal/                   Data access for clipboard, notes, settings, images,
                         moodboard
  color.ts               Conversions, WCAG, color-blindness, palette math
  svg.ts                 SVG metadata + light optimizer
  tokens.ts              Colour-token format detection + translation
  og.ts                  Server-side OpenGraph metadata fetcher
data/                    SQLite database (gitignored)
```

## Scripts

```bash
npm run dev      # local dev with hot reload
npm run build    # production build
npm run start    # run production build
npm run lint     # eslint
```

## License

MIT — see [LICENSE](./LICENSE).
