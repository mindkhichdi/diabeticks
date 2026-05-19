import { useEffect, useState } from "react";
import Mascot from "./Mascot";
import { X } from "lucide-react";

interface MascotNudgeProps {
  message: string;
  /** Re-trigger animation when this changes */
  triggerKey?: string | number;
}

const MascotNudge = ({ message, triggerKey }: MascotNudgeProps) => {
  const [open, setOpen] = useState(true);
  const [pop, setPop] = useState(0);

  useEffect(() => {
    setOpen(true);
    setPop((p) => p + 1);
  }, [triggerKey]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-28 right-4 sm:right-6 z-40 animate-bounce-gentle"
        aria-label="Show Duo"
      >
        <Mascot size={64} />
      </button>
    );
  }

  return (
    <div
      key={pop}
      className="fixed bottom-28 right-4 sm:right-6 z-40 flex items-end gap-2 animate-scale-in pointer-events-none"
    >
      {/* Speech bubble */}
      <div className="pointer-events-auto relative max-w-[220px] sm:max-w-[260px] rounded-2xl border-2 border-border bg-card px-4 py-3 text-sm font-bold text-foreground shadow-[0_4px_0_0_hsl(var(--border))]">
        <button
          onClick={() => setOpen(false)}
          className="absolute -top-2 -right-2 rounded-full bg-muted border-2 border-border p-0.5 hover:bg-secondary"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
        {message}
        {/* Tail */}
        <span className="absolute -bottom-2 right-6 w-4 h-4 rotate-45 bg-card border-r-2 border-b-2 border-border" />
      </div>
      <div className="pointer-events-auto animate-bounce-gentle">
        <Mascot size={72} mood="wave" />
      </div>
    </div>
  );
};

export default MascotNudge;
