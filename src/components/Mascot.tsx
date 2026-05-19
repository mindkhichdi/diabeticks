import { cn } from "@/lib/utils";

interface MascotProps {
  className?: string;
  size?: number;
  mood?: "happy" | "excited" | "wave" | "cheer";
}

/**
 * Duo-style cute owl mascot, pure SVG so it scales crisply.
 */
const Mascot = ({ className, size = 96, mood = "happy" }: MascotProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={cn("drop-shadow-md", className)}
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="60" cy="78" rx="40" ry="34" fill="hsl(var(--primary))" />
      {/* Belly */}
      <ellipse cx="60" cy="84" rx="26" ry="22" fill="hsl(var(--primary-glow))" />
      {/* Head */}
      <ellipse cx="60" cy="48" rx="38" ry="32" fill="hsl(var(--primary))" />
      {/* Ear tufts */}
      <path d="M28 26 L34 14 L42 24 Z" fill="hsl(var(--primary))" />
      <path d="M92 26 L86 14 L78 24 Z" fill="hsl(var(--primary))" />
      {/* Eye whites */}
      <circle cx="46" cy="46" r="12" fill="#fff" />
      <circle cx="74" cy="46" r="12" fill="#fff" />
      {/* Pupils */}
      <circle cx="48" cy="48" r="5" fill="#1a1a1a" />
      <circle cx="76" cy="48" r="5" fill="#1a1a1a" />
      <circle cx="50" cy="46" r="1.6" fill="#fff" />
      <circle cx="78" cy="46" r="1.6" fill="#fff" />
      {/* Beak */}
      <path
        d="M55 58 Q60 66 65 58 Q60 64 55 58 Z"
        fill="hsl(var(--streak))"
        stroke="hsl(var(--streak-shadow))"
        strokeWidth="1.2"
      />
      {/* Cheeks */}
      <circle cx="36" cy="58" r="4" fill="hsl(var(--destructive) / 0.35)" />
      <circle cx="84" cy="58" r="4" fill="hsl(var(--destructive) / 0.35)" />
      {/* Wings */}
      <ellipse
        cx="22"
        cy="78"
        rx="8"
        ry="14"
        fill="hsl(var(--primary-shadow))"
        className={mood === "wave" ? "origin-bottom animate-wiggle" : ""}
      />
      <ellipse cx="98" cy="78" rx="8" ry="14" fill="hsl(var(--primary-shadow))" />
      {/* Feet */}
      <ellipse cx="48" cy="112" rx="7" ry="4" fill="hsl(var(--streak))" />
      <ellipse cx="72" cy="112" rx="7" ry="4" fill="hsl(var(--streak))" />
    </svg>
  );
};

export default Mascot;
