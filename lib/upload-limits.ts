/**
 * Single source of truth for upload size limits.
 *
 * Anything we persist to the user's account (moodboard pictures, fontbook
 * files) goes through this cap. Tools that just open a file locally for
 * processing (JSON formatter, SVG viewer, image kit) are unaffected — they
 * never leave the browser.
 */

export const MAX_UPLOAD_BYTES = 1_048_576; // 1 MiB
export const MAX_UPLOAD_LABEL = '1 MB';

/** Pretty print a byte count as MB with two decimals. */
export function formatMb(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** Reusable copy for the toast/inline error after a too-large file is picked. */
export function tooLargeMessage(actualBytes: number): string {
    return `That file is ${formatMb(actualBytes)} — we cap saved uploads at ${MAX_UPLOAD_LABEL}.`;
}
