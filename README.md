# des/toolkit

A warm, browser-based workshop of design + frontend tools, with a moodboard
to keep your inspiration in one place. Built on Next.js with SQLite-backed
persistence and a coherent design system ("Clay") across every tool.

```
des/toolkit
├── 22 tools across 6 labs
├── Moodboard with OG-fetched preview cards
└── Single warm cream canvas, Inter typography
```

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Persistence (clipboard tabs, notes, moodboard,
settings) lives in `data/des-toolkit.db` — gitignored, created on first run.

### Optional: Gemini imagery

Copy `.env.local.example` to `.env.local` and add a key from
<https://aistudio.google.com/app/apikey>:

```env
GEMINI_API_KEY=your-key-here
```

Restart `npm run dev` and the `/gemini` tool will work. The key never
leaves the server.

## What's inside

### Moodboard

| Path | What it does |
|---|---|
| **/moodboard** | Browse, create, and delete inspiration boards (saturated card grid) |
| **/moodboard/[id]** | Paste any URL — server fetches the page's OpenGraph metadata and renders a Pinterest-style card. Inline-rename the board, refresh previews, click cards to open at source. Sites that block scrapers (Pinterest, Canva) save as URL-only cards. |

### Color lab

| Path | What it does |
|---|---|
| **/color-picker** | Pick a colour with the native picker, paste an image to sample its average colour, or paste a HEX. Live conversion across HEX · RGB · HSL · HSB; click any of the nine ramp stops to set the active colour. |
| **/color/contrast** | WCAG 2.1 contrast ratio for any foreground/background pair, with AA/AAA badges for both small and large text. Plus a 4-up colour-blindness preview (deuteranopia, protanopia, tritanopia, achromatopsia) with per-kind contrast recompute. |
| **/color/palette** | Generate a 9-step ramp + five harmonies (complementary, analogous, triadic, split-complementary, tetradic) from any base colour. Click to copy individual swatches; export the full ramp as CSS variables, Tailwind config, or JSON. |
| **/color/gradient** | Compose linear / radial / conic gradients with up to six stops, drag the angle, and copy the CSS rule. The "+ Add stop" button picks the widest gap and interpolates a midpoint colour. |

### CSS lab

| Path | What it does |
|---|---|
| **/css/shadow** | Stack up to six box-shadow layers; per-layer x/y/blur/spread/colour/alpha/inset; light + dark preview surface; per-layer enable toggle; copyable composed rule. |
| **/css/radius** | Three modes: uniform / per-corner / asymmetric (squircle). Px or % units. Five shape presets (Rounded, Pill, Squircle, Asymmetric, Tab). Copyable rule. |
| **/css/bezier** | Drag two SVG control handles to design an easing curve. Live motion preview animates a dot using your curve via Newton-Raphson `tForX`. Six named presets including a spring-back overshoot. |
| **/diff** | Side-by-side text diff with character-level highlights, line-pair merge buttons (← →), optional sync-scroll. |

### Type lab

| Path | What it does |
|---|---|
| **/type/scale** | Modular type ramp from a base size and one of 8 musical-interval ratios (Minor 2nd through Golden ratio). Nine steps from caption to display, line-heights auto-tighten with size. Click any row to copy `font-size: …; line-height: …;` Export as CSS variables or Tailwind `fontSize` config. |
| **/type/pairing** | Heading + body Google Fonts pair preview on real editorial copy (kicker, h1, lead, body, blockquote, mono). 21 curated fonts across sans/serif/display/mono. 7 named presets. Dynamic Google Fonts `<link>` injection; copy `@import` + CSS variables. |
| **/type/spacing** | 10-step spacing scale in linear / modular / fibonacci modes. Bars sized proportionally. Click any token to copy. Live breakpoint preview at mobile / sm / md / lg / xl with 1→2→3 column reflow. |
| **/markdown-preview** | Live two-pane GitHub-flavored markdown editor; persistent input; light `oneLight` syntax highlighting on cream code surfaces. Copy markdown or HTML. |

### Assets lab

| Path | What it does |
|---|---|
| **/assets/svg** | Render any SVG over a transparent checker (light + dark canvas). Light optimizer strips XML decl, comments, metadata/title/desc, Adobe/Sketch/Inkscape namespaces and rounds long decimals. Live byte-savings counter. |
| **/assets/image** | Drop an image to read MIME type, size, dimensions, aspect ratio. Copy the full base64 data URL. Generate a complete favicon raster set at 16/32/48/64/128/192/512 (canvas-rendered with letterboxing). Click a tile to download as PNG; copy `<link rel="icon">` HTML snippet. |
| **/assets/tokens** | Translate colour tokens between CSS variables, Tailwind config, and W3C `tokens.json`. Auto-detects input format. Loose-JSON parser handles unquoted keys + trailing commas. Status row shows token count + a swatch preview strip. |
| **/download** | One-keystroke save of whatever's on your clipboard — text or image. ⌘V to read, with PNG/JPG/GIF/WebP support and a fallback for browsers without `clipboard.read()`. |

### Frontend lab

| Path | What it does |
|---|---|
| **/compare** | Two-pane HTML/CSS playground; each pane drives a sandboxed iframe via `srcDoc`. Layout toggle (Split / Stacked); viewport simulation (Fluid / 380 / 640 / 768 / 1024); optional sync-scroll; per-pane Copy / Clear; checker-pattern preview surfaces for transparent designs. |
| **/clipboard** | Tabbed scratchpad with line numbers and persistent storage. Rename tabs (double-click), close tabs, copy / clear all. Auto-saves to SQLite. |
| **/json-formatter** | Format / validate / minify / tree-view JSON. Auto-decodes URL-encoded and Base64-wrapped JSON. Tree view with hover-path display, search, expand/collapse all, sort keys, indent toggle (2 / 4 / tab). |

### AI lab

| Path | What it does |
|---|---|
| **/gemini** | Prompt → image via Google Imagen on the Gemini API. 5 aspect ratios (1:1, 3:4, 4:3, 9:16, 16:9). Server-side key handling — your `GEMINI_API_KEY` never leaves the server. Copy data URL or download PNG. Defensive UX with missing-key / auth-fail / loading banner states. |

### Still in original chrome

These four utilities work but haven't been migrated to the Clay design yet:

| Path | What it does |
|---|---|
| **/csv-viewer** | Parse, sort, search and export CSV in the browser |
| **/jwt-decoder** | Decode and inspect JWT header + payload claims |
| **/pomodoro** | Focus timer with optional TensorFlow.js posture monitoring on webcam |
| **/notes-pad** | Personal scratchpad notes |
| **/notes/[topic]** | Renders external markdown notes from the `dev-diary` repo |

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
- **SQLite** via `better-sqlite3` for clipboard tabs, notes, moodboard, settings
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
