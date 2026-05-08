// Color-token translator.
// We support three input formats and emit the other two from a normalized
// flat map of `name → hex`. The names use dot-separated paths so nested groups
// can round-trip cleanly.

import { hexToRgb, rgbToHex } from './color';

export type TokenFormat = 'css' | 'tailwind' | 'json';

export interface FlatToken {
    /** Dot-path from the root: e.g. "brand.pink" or "neutral.500". */
    path: string;
    hex: string;
}

// ── Detection ──────────────────────────────────────────────────────────────

export function detectFormat(input: string): TokenFormat | null {
    const s = input.trim();
    if (!s) return null;
    if (/^[:\s]*:?root\s*\{/.test(s) || /--[a-z0-9-]+\s*:/i.test(s)) return 'css';
    // Bracketed object that mentions a known Tailwind key
    if (/colors\s*:\s*\{/.test(s) || /^module\.exports/m.test(s)) return 'tailwind';
    if (/^[\s\n]*\{/.test(s)) {
        try {
            const parsed = JSON.parse(s);
            if (parsed && typeof parsed === 'object' && hasW3CTokens(parsed)) return 'json';
            if (parsed && typeof parsed === 'object') return 'tailwind'; // raw object literal
        } catch { /* fall through */ }
    }
    return null;
}

function hasW3CTokens(obj: unknown): boolean {
    if (!obj || typeof obj !== 'object') return false;
    for (const v of Object.values(obj as Record<string, unknown>)) {
        if (v && typeof v === 'object') {
            if ('value' in (v as Record<string, unknown>) && '$type' in (v as Record<string, unknown>)) return true;
            if ('value' in (v as Record<string, unknown>)) return true;
            if (hasW3CTokens(v)) return true;
        }
    }
    return false;
}

// ── Parse → flat list ──────────────────────────────────────────────────────

export function parse(input: string, format: TokenFormat): FlatToken[] {
    if (format === 'css') return parseCss(input);
    if (format === 'tailwind') return parseTailwind(input);
    return parseJson(input);
}

function parseCss(input: string): FlatToken[] {
    const out: FlatToken[] = [];
    const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
        const name = m[1];
        const value = m[2].trim();
        const hex = toHex(value);
        if (!hex) continue;
        // Convert kebab-case names with dashes → dot path. Last numeric segment becomes a "scale" leaf.
        const path = kebabToPath(name);
        out.push({ path, hex });
    }
    return out;
}

function kebabToPath(name: string): string {
    const parts = name.split('-');
    return parts.join('.');
}

function parseTailwind(input: string): FlatToken[] {
    // Pull the colors-like object literal. Be permissive — accept module.exports,
    // export default, or a raw object.
    let body = input.trim();

    // If there's a `colors:` key, take just that subtree.
    const colorsMatch = body.match(/colors\s*:\s*(\{[\s\S]*?\n\s*\})\s*[,}]/);
    if (colorsMatch) {
        body = colorsMatch[1];
    } else {
        // Otherwise expect a bare object — strip module.exports / export default wrappers.
        body = body.replace(/^[\s\S]*?(\{)/, '$1');
        body = body.replace(/;[\s]*$/, '');
    }

    const obj = looseJsonParse(body);
    if (!obj || typeof obj !== 'object') return [];
    return flattenObject(obj as Record<string, unknown>, []);
}

function parseJson(input: string): FlatToken[] {
    let parsed: unknown;
    try { parsed = JSON.parse(input); } catch { return []; }
    if (!parsed || typeof parsed !== 'object') return [];

    // Walk: if a node has { value, $type? } treat that as a leaf.
    const out: FlatToken[] = [];
    const walk = (node: unknown, path: string[]) => {
        if (!node || typeof node !== 'object') return;
        const obj = node as Record<string, unknown>;
        if ('value' in obj && typeof obj.value === 'string') {
            const hex = toHex(obj.value);
            if (hex) out.push({ path: path.join('.'), hex });
            return;
        }
        for (const [k, v] of Object.entries(obj)) {
            walk(v, [...path, k]);
        }
    };
    walk(parsed, []);

    // Tokens.json files often nest under a "color" root — strip that prefix if it's the only one.
    if (out.every((t) => t.path.startsWith('color.'))) {
        return out.map((t) => ({ path: t.path.slice('color.'.length), hex: t.hex }));
    }
    return out;
}

function flattenObject(obj: Record<string, unknown>, path: string[]): FlatToken[] {
    const out: FlatToken[] = [];
    for (const [k, v] of Object.entries(obj)) {
        const next = [...path, k];
        if (v && typeof v === 'object') {
            out.push(...flattenObject(v as Record<string, unknown>, next));
        } else if (typeof v === 'string') {
            const hex = toHex(v);
            if (hex) out.push({ path: next.join('.'), hex });
        }
    }
    return out;
}

function looseJsonParse(s: string): unknown {
    // Permit unquoted keys and trailing commas — typical of JS object literals.
    let cleaned = s
        .replace(/([{,]\s*)([a-zA-Z_$][\w$-]*)\s*:/g, '$1"$2":')
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/'([^']*)'/g, '"$1"');
    // Remove single-line comments
    cleaned = cleaned.replace(/\/\/[^\n]*/g, '');
    try { return JSON.parse(cleaned); } catch { return null; }
}

function toHex(value: string): string | null {
    const v = value.trim();
    const rgb = hexToRgb(v);
    if (rgb) return rgbToHex(rgb);
    const rgbMatch = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
        return rgbToHex({ r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] });
    }
    return null;
}

// ── Emit from flat list ────────────────────────────────────────────────────

export function emitCss(tokens: FlatToken[]): string {
    if (tokens.length === 0) return '/* no colour tokens detected */';
    const lines = tokens.map((t) => `  --${t.path.replace(/\./g, '-')}: ${t.hex};`);
    return `:root {\n${lines.join('\n')}\n}`;
}

export function emitTailwind(tokens: FlatToken[]): string {
    if (tokens.length === 0) return '/* no colour tokens detected */';
    const tree: Record<string, unknown> = {};
    for (const t of tokens) {
        const parts = t.path.split('.');
        let cur: Record<string, unknown> = tree;
        for (let i = 0; i < parts.length - 1; i++) {
            const k = parts[i];
            if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
            cur = cur[k] as Record<string, unknown>;
        }
        cur[parts[parts.length - 1]] = t.hex;
    }
    const body = serializeTailwind(tree, 1);
    return `module.exports = {\n  theme: {\n    extend: {\n      colors: ${body},\n    },\n  },\n};`;
}

function serializeTailwind(obj: Record<string, unknown>, depth: number): string {
    const indent = '  '.repeat(depth + 2);
    const close = '  '.repeat(depth + 1);
    const entries = Object.entries(obj).map(([k, v]) => {
        const safeKey = /^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k);
        if (typeof v === 'string') return `${indent}${safeKey}: '${v}'`;
        return `${indent}${safeKey}: ${serializeTailwind(v as Record<string, unknown>, depth + 1)}`;
    });
    return `{\n${entries.join(',\n')},\n${close}}`;
}

export function emitJson(tokens: FlatToken[]): string {
    if (tokens.length === 0) return '{}';
    const tree: Record<string, unknown> = {};
    for (const t of tokens) {
        const parts = t.path.split('.');
        let cur: Record<string, unknown> = tree;
        for (let i = 0; i < parts.length - 1; i++) {
            const k = parts[i];
            if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
            cur = cur[k] as Record<string, unknown>;
        }
        cur[parts[parts.length - 1]] = { $type: 'color', value: t.hex };
    }
    return JSON.stringify({ color: tree }, null, 2);
}
