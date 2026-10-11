import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Chrome fires this once, often before any component has mounted,
// so capture it at module load (imported from main.tsx).
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export const isMobile = () => isIos() || /android|mobile/i.test(navigator.userAgent);

/** `native`: the browser can show its own install dialog. `ios`: show Add to Home Screen steps. */
export type InstallMode = 'native' | 'ios' | null;

export const useInstallPrompt = () => {
  const [, rerender] = useState(0);

  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);

  let mode: InstallMode = null;
  if (!isStandalone()) {
    if (deferredPrompt) mode = 'native';
    else if (isIos()) mode = 'ios';
  }

  const install = async () => {
    if (!deferredPrompt) return false;
    const event = deferredPrompt;
    deferredPrompt = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    notify();
    return outcome === 'accepted';
  };

  return { mode, install };
};
