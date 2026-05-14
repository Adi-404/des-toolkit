'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getSettingAction, setSettingAction } from '@/app/actions/settings';

export interface ToolConfig {
    href: string;
    label: string;
    icon: string;
    enabled: boolean;
}

export type WheelModifier = 'Alt' | 'Control' | 'Shift' | 'Meta';

export interface ShortcutSettings {
    /** Letter (lowercase) combined with Cmd/Ctrl to open the command palette. */
    paletteKey: string;
    /** Single modifier key held to summon the radial wheel at the cursor. */
    wheelModifier: WheelModifier;
}

export interface AppSettings {
    contextMenuEnabled: boolean;
    tools: ToolConfig[];
    shortcuts: ShortcutSettings;
}

interface SettingsCtx {
    settings: AppSettings;
    update: (patch: Partial<AppSettings>) => void;
}

const Ctx = createContext<SettingsCtx | null>(null);

export const ALL_TOOLS: Omit<ToolConfig, 'enabled'>[] = [
    { label: 'Moodboard', href: '/moodboard',        icon: '✿'  },
    { label: 'Fonts',     href: '/fonts',             icon: 'Aa' },
    { label: 'Clipboard', href: '/clipboard',          icon: '⧉'  },
    { label: 'Diff',      href: '/diff',               icon: '⇄'  },
    { label: 'JSON',      href: '/json-formatter',     icon: '{}' },
    { label: 'Contrast',  href: '/color/contrast',     icon: '◐'  },
    { label: 'Bezier',    href: '/css/bezier',         icon: '∿'  },
    { label: 'Download',  href: '/download',           icon: '↓'  },
    { label: 'JWT',       href: '/jwt-decoder',        icon: '⚿'  },
    { label: 'Markdown',  href: '/markdown-preview',   icon: '¶'  },
    { label: 'CSV',       href: '/csv-viewer',         icon: '▦'  },
    { label: 'Notepad',   href: '/notes-pad',          icon: '≡'  },
    { label: 'Pomodoro',  href: '/pomodoro',           icon: '◔'  },
];

const KEY = 'des-toolkit-settings';
const DB_KEY = 'app_settings';

export const DEFAULT_SHORTCUTS: ShortcutSettings = {
    paletteKey: 'k',
    wheelModifier: 'Alt',
};

const VALID_WHEEL_MODIFIERS: readonly WheelModifier[] = ['Alt', 'Control', 'Shift', 'Meta'];

function sanitizeShortcuts(raw: Partial<ShortcutSettings> | undefined): ShortcutSettings {
    const paletteKeyRaw = (raw?.paletteKey ?? DEFAULT_SHORTCUTS.paletteKey).toString().toLowerCase();
    // Only allow a single printable character — anything else falls back to default.
    const paletteKey = paletteKeyRaw.length === 1 && /[a-z0-9]/.test(paletteKeyRaw)
        ? paletteKeyRaw
        : DEFAULT_SHORTCUTS.paletteKey;
    const wheelModifier = VALID_WHEEL_MODIFIERS.includes(raw?.wheelModifier as WheelModifier)
        ? (raw!.wheelModifier as WheelModifier)
        : DEFAULT_SHORTCUTS.wheelModifier;
    return { paletteKey, wheelModifier };
}

function defaults(): AppSettings {
    return {
        contextMenuEnabled: true,
        tools: ALL_TOOLS.map(t => ({ ...t, enabled: true })),
        shortcuts: { ...DEFAULT_SHORTCUTS },
    };
}

function parse(raw: string): AppSettings {
    try {
        const saved = JSON.parse(raw) as Partial<AppSettings>;
        const d = defaults();
        const savedHrefs = new Set((saved.tools ?? []).map(t => t.href));
        const newTools = d.tools.filter(t => !savedHrefs.has(t.href));
        return {
            contextMenuEnabled: saved.contextMenuEnabled ?? d.contextMenuEnabled,
            tools: [
                ...(saved.tools ?? d.tools)
                    .map(t => {
                        const meta = ALL_TOOLS.find(a => a.href === t.href);
                        if (!meta) return null;
                        return { ...meta, enabled: t.enabled };
                    })
                    .filter((t): t is ToolConfig => t !== null),
                ...newTools,
            ],
            shortcuts: sanitizeShortcuts(saved.shortcuts),
        };
    } catch {
        return defaults();
    }
}

function readLocal(): AppSettings | null {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? parse(raw) : null;
    } catch {
        return null;
    }
}

function clearLocal(): void {
    try { localStorage.removeItem(KEY); } catch {}
}

interface InnerProps {
    userId: string | null;
    isLoaded: boolean;
    children: ReactNode;
}

function InnerSettingsProvider({ userId, isLoaded, children }: InnerProps) {
    const [settings, setSettings] = useState<AppSettings>(defaults);
    const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // undefined = haven't observed an auth state yet; null = anonymous; string = signed-in
    const currentUserRef = useRef<string | null | undefined>(undefined);

    useEffect(() => {
        if (!isLoaded) return;
        if (currentUserRef.current === userId) return;

        const prev = currentUserRef.current;
        currentUserRef.current = userId;

        // A queued write may still be in flight for the *previous* user — cancel it.
        if (persistTimerRef.current) {
            clearTimeout(persistTimerRef.current);
            persistTimerRef.current = null;
        }

        // Any user-id transition (sign-in, sign-out, account switch) wipes the
        // local cache so the next anonymous session can't inherit it. The very
        // first transition (undefined -> initial state) is not a switch, so
        // skip clearing then.
        if (prev !== undefined) clearLocal();

        // Show defaults during the load so we never flash the prior user's wheel.
        setSettings(defaults());

        let cancelled = false;
        (async () => {
            if (userId) {
                const dbRaw = await getSettingAction(DB_KEY).catch(() => null);
                if (cancelled || currentUserRef.current !== userId) return;
                setSettings(dbRaw ? parse(dbRaw) : defaults());
            } else {
                const local = readLocal();
                if (cancelled || currentUserRef.current !== userId) return;
                setSettings(local ?? defaults());
            }
        })();
        return () => { cancelled = true; };
    }, [isLoaded, userId]);

    const update = useCallback((patch: Partial<AppSettings>) => {
        if (!isLoaded) return;
        setSettings(prev => {
            const next = { ...prev, ...patch };
            const json = JSON.stringify(next);
            if (userId) {
                // Signed-in: DB only. Writing to localStorage here would be the
                // exact leak we're trying to prevent.
                if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
                persistTimerRef.current = setTimeout(() => {
                    setSettingAction(DB_KEY, json).catch(() => {});
                }, 300);
            } else {
                try { localStorage.setItem(KEY, json); } catch {}
            }
            return next;
        });
    }, [isLoaded, userId]);

    return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

function ClerkAwareSettingsProvider({ children }: { children: ReactNode }) {
    const { isLoaded, userId } = useAuth();
    return (
        <InnerSettingsProvider userId={userId ?? null} isLoaded={isLoaded}>
            {children}
        </InnerSettingsProvider>
    );
}

function AnonymousSettingsProvider({ children }: { children: ReactNode }) {
    return (
        <InnerSettingsProvider userId={null} isLoaded={true}>
            {children}
        </InnerSettingsProvider>
    );
}

// Inlined at build time by Next.js, so this branch is stable across renders —
// safe to call hooks conditionally on the basis of which provider wins.
const clerkConfigured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function SettingsProvider({ children }: { children: ReactNode }) {
    return clerkConfigured
        ? <ClerkAwareSettingsProvider>{children}</ClerkAwareSettingsProvider>
        : <AnonymousSettingsProvider>{children}</AnonymousSettingsProvider>;
}

export function useSettings() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
    return ctx;
}
