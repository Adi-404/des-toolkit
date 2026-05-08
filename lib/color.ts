// Shared color utilities used across the Color & a11y cluster.

export interface RGB { r: number; g: number; b: number; }
export interface HSL { h: number; s: number; l: number; }
export interface HSB { h: number; s: number; b: number; }

// ── Parsing ──────────────────────────────────────────────────────────────────

export function hexToRgb(hex: string): RGB | null {
    const clean = hex.trim().replace('#', '');
    if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16);
        const g = parseInt(clean[1] + clean[1], 16);
        const b = parseInt(clean[2] + clean[2], 16);
        if ([r, g, b].some(isNaN)) return null;
        return { r, g, b };
    }
    if (clean.length === 6) {
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        if ([r, g, b].some(isNaN)) return null;
        return { r, g, b };
    }
    return null;
}

export function rgbToHex({ r, g, b }: RGB): string {
    const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
}

/** Try to parse hex / rgb() / hsl() / bare-hex strings into an RGB. */
export function parseColor(input: string): RGB | null {
    const s = input.trim();
    if (!s) return null;
    if (s.startsWith('#') || /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(s)) {
        return hexToRgb(s);
    }
    const rgbMatch = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    if (rgbMatch) {
        const [, r, g, b] = rgbMatch;
        return { r: +r, g: +g, b: +b };
    }
    const hslMatch = s.match(/^hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%/i);
    if (hslMatch) {
        const [, h, sP, l] = hslMatch;
        return hslToRgb({ h: +h, s: +sP, l: +l });
    }
    return null;
}

// ── Conversions ──────────────────────────────────────────────────────────────

export function rgbToHsl({ r, g, b }: RGB): HSL {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        if (max === rn) h = ((gn - bn) / delta + 6) % 6;
        else if (max === gn) h = (bn - rn) / delta + 2;
        else h = (rn - gn) / delta + 4;
        h = (h * 60 + 360) % 360;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
    const sn = s / 100, ln = l / 100;
    const c = (1 - Math.abs(2 * ln - 1)) * sn;
    const hh = ((h % 360) + 360) % 360 / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r1 = 0, g1 = 0, b1 = 0;
    if (hh < 1) [r1, g1, b1] = [c, x, 0];
    else if (hh < 2) [r1, g1, b1] = [x, c, 0];
    else if (hh < 3) [r1, g1, b1] = [0, c, x];
    else if (hh < 4) [r1, g1, b1] = [0, x, c];
    else if (hh < 5) [r1, g1, b1] = [x, 0, c];
    else [r1, g1, b1] = [c, 0, x];
    const m = ln - c / 2;
    return {
        r: Math.round((r1 + m) * 255),
        g: Math.round((g1 + m) * 255),
        b: Math.round((b1 + m) * 255),
    };
}

export function rgbToHsb({ r, g, b }: RGB): HSB {
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;
    const sat = max === 0 ? 0 : delta / max;
    if (delta !== 0) {
        if (max === rn) h = ((gn - bn) / delta + 6) % 6;
        else if (max === gn) h = (bn - rn) / delta + 2;
        else h = (rn - gn) / delta + 4;
        h = (h * 60 + 360) % 360;
    }
    return { h: Math.round(h), s: Math.round(sat * 100), b: Math.round(max * 100) };
}

// ── WCAG luminance & contrast ────────────────────────────────────────────────

export function relativeLuminance({ r, g, b }: RGB): number {
    const lin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(a: RGB, b: RGB): number {
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

export type WcagLevel = 'fail' | 'aa-large' | 'aa' | 'aaa';

/** Returns the highest WCAG level passed for the given (ratio, large?) pair. */
export function wcagLevel(ratio: number, large = false): WcagLevel {
    const aaa = large ? 4.5 : 7;
    const aa = large ? 3 : 4.5;
    if (ratio >= aaa) return 'aaa';
    if (ratio >= aa) return 'aa';
    if (large && ratio >= 3) return 'aa-large';
    return 'fail';
}

export function isLight(rgb: RGB): boolean {
    return relativeLuminance(rgb) > 0.4;
}

/** Pick black or white for foreground text on the given background. */
export function readableOn(bg: RGB): RGB {
    return isLight(bg) ? { r: 10, g: 10, b: 10 } : { r: 255, g: 255, b: 255 };
}

// ── Color blindness simulation ───────────────────────────────────────────────
// Vischeck-style 3x3 matrices applied to sRGB. Approximate but visually useful.

const CB_MATRICES: Record<ColorBlindKind, number[]> = {
    protanopia:   [0.567, 0.433, 0,   0.558, 0.442, 0,   0,    0.242, 0.758],
    deuteranopia: [0.625, 0.375, 0,   0.7,   0.3,   0,   0,    0.3,   0.7],
    tritanopia:   [0.95,  0.05,  0,   0,     0.433, 0.567, 0,  0.475, 0.525],
    achromatopsia:[0.299, 0.587, 0.114, 0.299, 0.587, 0.114, 0.299, 0.587, 0.114],
};

export type ColorBlindKind = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export const colorBlindKinds: { kind: ColorBlindKind; label: string; pop: string }[] = [
    { kind: 'deuteranopia', label: 'Deuteranopia', pop: 'red-green · ~6% of men' },
    { kind: 'protanopia',   label: 'Protanopia',   pop: 'red-green · ~1% of men' },
    { kind: 'tritanopia',   label: 'Tritanopia',   pop: 'blue-yellow · rare' },
    { kind: 'achromatopsia', label: 'Achromatopsia', pop: 'no color · very rare' },
];

export function simulateColorBlind({ r, g, b }: RGB, kind: ColorBlindKind): RGB {
    const m = CB_MATRICES[kind];
    return {
        r: Math.round(Math.max(0, Math.min(255, m[0] * r + m[1] * g + m[2] * b))),
        g: Math.round(Math.max(0, Math.min(255, m[3] * r + m[4] * g + m[5] * b))),
        b: Math.round(Math.max(0, Math.min(255, m[6] * r + m[7] * g + m[8] * b))),
    };
}

// ── Palette math ─────────────────────────────────────────────────────────────

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }

function mix(a: RGB, b: RGB, t: number): RGB {
    return {
        r: Math.round(a.r + (b.r - a.r) * t),
        g: Math.round(a.g + (b.g - a.g) * t),
        b: Math.round(a.b + (b.b - a.b) * t),
    };
}

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

/** Tints — base mixed toward white at evenly spaced steps. */
export function tints(base: RGB, steps = 5): RGB[] {
    return Array.from({ length: steps }, (_, i) => mix(base, WHITE, clamp01((i + 1) / (steps + 1))));
}

/** Shades — base mixed toward black at evenly spaced steps. */
export function shades(base: RGB, steps = 5): RGB[] {
    return Array.from({ length: steps }, (_, i) => mix(base, BLACK, clamp01((i + 1) / (steps + 1))));
}

/** A 9-step ramp combining shades, base, and tints. */
export function ramp(base: RGB, steps = 9): RGB[] {
    const half = Math.floor(steps / 2);
    const dark = shades(base, half).reverse();
    const light = tints(base, steps - half - 1);
    return [...dark, base, ...light];
}

function rotateHue(rgb: RGB, deg: number): RGB {
    const hsl = rgbToHsl(rgb);
    return hslToRgb({ ...hsl, h: (hsl.h + deg + 360) % 360 });
}

export interface Harmony {
    name: string;
    description: string;
    swatches: RGB[];
}

export function harmonies(base: RGB): Harmony[] {
    return [
        {
            name: 'Complementary',
            description: 'Opposite on the wheel — high contrast pair.',
            swatches: [base, rotateHue(base, 180)],
        },
        {
            name: 'Analogous',
            description: 'Neighbours on the wheel — calm and harmonious.',
            swatches: [rotateHue(base, -30), base, rotateHue(base, 30)],
        },
        {
            name: 'Triadic',
            description: 'Three evenly-spaced hues — vibrant and balanced.',
            swatches: [base, rotateHue(base, 120), rotateHue(base, 240)],
        },
        {
            name: 'Split-complementary',
            description: 'Base plus the two neighbours of its complement.',
            swatches: [base, rotateHue(base, 150), rotateHue(base, 210)],
        },
        {
            name: 'Tetradic',
            description: 'Four hues forming a rectangle — needs careful weighting.',
            swatches: [base, rotateHue(base, 90), rotateHue(base, 180), rotateHue(base, 270)],
        },
    ];
}

// ── Formatting helpers ───────────────────────────────────────────────────────

export function formatRgb(rgb: RGB): string {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

export function formatHsl(rgb: RGB): string {
    const { h, s, l } = rgbToHsl(rgb);
    return `hsl(${h}, ${s}%, ${l}%)`;
}

export function formatHsb(rgb: RGB): string {
    const { h, s, b } = rgbToHsb(rgb);
    return `hsb(${h}, ${s}%, ${b}%)`;
}
