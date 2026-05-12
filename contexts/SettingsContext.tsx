'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface ToolConfig {
    href: string;
    label: string;
    icon: string;
    enabled: boolean;
}

export interface AppSettings {
    contextMenuEnabled: boolean;
    tools: ToolConfig[];
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

function defaults(): AppSettings {
    return {
        contextMenuEnabled: true,
        tools: ALL_TOOLS.map(t => ({ ...t, enabled: true })),
    };
}

function load(): AppSettings {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return defaults();
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
        };
    } catch {
        return defaults();
    }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaults);

    useEffect(() => { setSettings(load()); }, []);

    function update(patch: Partial<AppSettings>) {
        setSettings(prev => {
            const next = { ...prev, ...patch };
            localStorage.setItem(KEY, JSON.stringify(next));
            return next;
        });
    }

    return <Ctx.Provider value={{ settings, update }}>{children}</Ctx.Provider>;
}

export function useSettings() {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useSettings must be inside SettingsProvider');
    return ctx;
}
