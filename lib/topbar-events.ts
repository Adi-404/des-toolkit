/**
 * Cross-component event names dispatched by the topbar's context-aware CTA.
 *
 * The CTA lives in <Topbar /> at the layout root. When the user is already
 * inside a tool (e.g. /moodboard, /fonts), the CTA can't navigate — that
 * would duplicate the left nav. Instead it fires one of these events; the
 * tool page's URL input listens and focuses itself.
 *
 * Kept as constants to avoid string typos drifting between dispatcher and
 * listener.
 */
export const FOCUS_MOODBOARD_ADD = 'clay:focus-moodboard-add';
export const FOCUS_FONTBOOK_ADD  = 'clay:focus-fontbook-add';
