'use client';

import { useEffect, useState } from 'react';

export interface Platform {
    isMac: boolean;
    /** Display label for the platform's primary modifier (⌘ on mac, Ctrl elsewhere). */
    modLabel: string;
    /** Display label for the secondary modifier (⌥ on mac, Alt elsewhere). */
    altLabel: string;
}

function detect(): Platform {
    if (typeof navigator === 'undefined') return { isMac: true, modLabel: '⌘', altLabel: '⌥' };
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
        ?? navigator.platform
        ?? '';
    const isMac = /Mac|iPhone|iPad|iPod/i.test(platform);
    return {
        isMac,
        modLabel: isMac ? '⌘' : 'Ctrl',
        altLabel: isMac ? '⌥' : 'Alt',
    };
}

/**
 * SSR-safe platform detection. The initial render assumes mac (matches the
 * server-rendered output for non-mac users until hydration) and then the
 * effect resolves the actual platform on mount.
 */
export function usePlatform(): Platform {
    const [platform, setPlatform] = useState<Platform>({ isMac: true, modLabel: '⌘', altLabel: '⌥' });
    useEffect(() => { setPlatform(detect()); }, []);
    return platform;
}
