import { useEffect, useState } from 'react';
import { Share, SquarePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { isMobile, useInstallPrompt } from '@/lib/pwa';

const DISMISS_KEY = 'install-prompt-dismissed-at';
const DISMISS_DAYS = 14;

const recentlyDismissed = () => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

/** Invites phone users to add Diabeticks to their home screen. Renders nothing once installed. */
const InstallPrompt = ({ className }: { className?: string }) => {
  const { mode, install } = useInstallPrompt();
  const [hidden, setHidden] = useState(recentlyDismissed);
  const [ready, setReady] = useState(false);

  // Give the page a moment to settle before asking.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  if (!ready || hidden || !mode || !isMobile()) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* private mode */ }
    setHidden(true);
  };

  return (
    <aside
      aria-label="Install Diabeticks"
      className={cn('animate-slide-up rounded-2xl border border-border bg-card p-4 shadow-lg', className)}
    >
      <div className="flex items-start gap-3">
        <img src="/icon-192x192.png" alt="" className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="font-bold">Add Diabeticks to your home screen</p>
          {mode === 'native' ? (
            <p className="mt-0.5 text-sm text-muted-foreground">Open it like an app, full screen, in one tap.</p>
          ) : (
            <ol className="mt-1.5 space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                1. Tap <Share className="inline h-4 w-4 text-primary" aria-label="Share" /> at the bottom of Safari
              </li>
              <li className="flex items-center gap-1.5">
                2. Choose <SquarePlus className="inline h-4 w-4 text-primary" aria-hidden /> <span className="font-bold text-foreground">Add to Home Screen</span>
              </li>
            </ol>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Not now"
          className="-mr-1 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      {mode === 'native' && (
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={dismiss}>Not now</Button>
          <Button onClick={async () => { if (!(await install())) dismiss(); }}>Install app</Button>
        </div>
      )}
    </aside>
  );
};

export default InstallPrompt;
