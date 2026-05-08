// Lightweight SVG cleanup. Conservative: strips obvious junk and rounds numbers
// without restructuring the markup, so the result is byte-equivalent for visual purposes.

export interface SvgInfo {
    width: number | null;
    height: number | null;
    viewBox: string | null;
    bytes: number;
}

export function parseSvgInfo(source: string): SvgInfo {
    const widthMatch = source.match(/<svg[^>]*\swidth\s*=\s*["']([^"']+)["']/i);
    const heightMatch = source.match(/<svg[^>]*\sheight\s*=\s*["']([^"']+)["']/i);
    const viewBoxMatch = source.match(/<svg[^>]*\sviewBox\s*=\s*["']([^"']+)["']/i);

    const parsed = (s: string | undefined): number | null => {
        if (!s) return null;
        const n = parseFloat(s);
        return Number.isFinite(n) ? n : null;
    };

    return {
        width: parsed(widthMatch?.[1]),
        height: parsed(heightMatch?.[1]),
        viewBox: viewBoxMatch?.[1] ?? null,
        bytes: new Blob([source]).size,
    };
}

export function optimizeSvg(source: string): string {
    let s = source;

    // Strip XML declaration and DOCTYPE
    s = s.replace(/<\?xml[\s\S]*?\?>\s*/g, '');
    s = s.replace(/<!DOCTYPE[\s\S]*?>\s*/gi, '');

    // Strip comments
    s = s.replace(/<!--[\s\S]*?-->/g, '');

    // Strip metadata, title, desc
    s = s.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    s = s.replace(/<title[\s\S]*?<\/title>/gi, '');
    s = s.replace(/<desc[\s\S]*?<\/desc>/gi, '');

    // Strip Adobe / Sketch / Inkscape namespace attrs
    s = s.replace(/\s+(?:xmlns:[a-z0-9]+|inkscape:[a-z0-9-]+|sodipodi:[a-z0-9-]+|sketch:[a-z0-9-]+)\s*=\s*"[^"]*"/gi, '');

    // Strip empty class="" and id="" attrs
    s = s.replace(/\s+(?:class|id)\s*=\s*""/gi, '');

    // Round long decimal numbers to 3 places (be careful inside attribute values).
    s = s.replace(/(\d+\.\d{4,})/g, (m) => Number(m).toFixed(3).replace(/\.?0+$/, ''));

    // Collapse whitespace between tags
    s = s.replace(/>\s+</g, '><');
    s = s.replace(/\s{2,}/g, ' ');

    return s.trim();
}

export function isLikelySvg(text: string): boolean {
    return /<svg[\s>]/i.test(text);
}
