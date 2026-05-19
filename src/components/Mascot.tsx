import { cn } from "@/lib/utils";

interface MascotProps {
  className?: string;
  size?: number;
  mood?: "happy" | "excited" | "wave" | "cheer";
}

/**
 * "Beanie" — a chubby round bear cub mascot. Pure SVG.
 */
const Mascot = ({ className, size = 96, mood = "happy" }: MascotProps) => {
  const waving = mood === "wave" || mood === "cheer";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={cn("drop-shadow-md", className)}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="bellyGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="hsl(var(--gold) / 0.9)" />
          <stop offset="100%" stopColor="hsl(var(--streak) / 0.85)" />
        </radialGradient>
      </defs>

      {/* Feet */}
      <ellipse cx="44" cy="112" rx="11" ry="6" fill="hsl(28 50% 35%)" />
      <ellipse cx="76" cy="112" rx="11" ry="6" fill="hsl(28 50% 35%)" />
      <ellipse cx="44" cy="110" rx="6" ry="2.5" fill="hsl(var(--gold))" />
      <ellipse cx="76" cy="110" rx="6" ry="2.5" fill="hsl(28 60% 70%)" />

      {/* Body */}
      <ellipse cx="60" cy="80" rx="34" ry="30" fill="hsl(28 55% 55%)" />
      {/* Belly patch */}
      <ellipse cx="60" cy="84" rx="20" ry="18" fill="url(#bellyGrad)" />

      {/* Arms */}
      <ellipse
        cx="24"
        cy="74"
        rx="9"
        ry="13"
        fill="hsl(28 55% 50%)"
        className={waving ? "origin-top animate-wiggle" : ""}
        style={{ transformBox: "fill-box", transformOrigin: "50% 10%" }}
      />
      <ellipse cx="96" cy="80" rx="9" ry="13" fill="hsl(28 55% 50%)" />

      {/* Head */}
      <circle cx="60" cy="46" r="32" fill="hsl(28 55% 58%)" />

      {/* Ears outer */}
      <circle cx="30" cy="24" r="10" fill="hsl(28 55% 50%)" />
      <circle cx="90" cy="24" r="10" fill="hsl(28 55% 50%)" />
      {/* Ears inner */}
      <circle cx="30" cy="25" r="5" fill="hsl(354 70% 78%)" />
      <circle cx="90" cy="25" r="5" fill="hsl(354 70% 78%)" />

      {/* Face muzzle */}
      <ellipse cx="60" cy="56" rx="16" ry="12" fill="hsl(45 60% 88%)" />

      {/* Eyes */}
      <circle cx="48" cy="42" r="4.5" fill="#1a1a1a" />
      <circle cx="72" cy="42" r="4.5" fill="#1a1a1a" />
      <circle cx="49.5" cy="40.5" r="1.6" fill="#fff" />
      <circle cx="73.5" cy="40.5" r="1.6" fill="#fff" />

      {/* Eyebrows */}
      <path d="M42 33 Q48 30 54 33" stroke="hsl(28 50% 30%)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M66 33 Q72 30 78 33" stroke="hsl(28 50% 30%)" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <ellipse cx="60" cy="52" rx="3.5" ry="2.5" fill="#1a1a1a" />

      {/* Smile */}
      <path
        d="M52 60 Q60 68 68 60"
        stroke="#1a1a1a"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tongue */}
      <path d="M57 63 Q60 67 63 63 Z" fill="hsl(354 80% 65%)" />

      {/* Cheeks */}
      <circle cx="40" cy="54" r="4" fill="hsl(354 80% 70% / 0.55)" />
      <circle cx="80" cy="54" r="4" fill="hsl(354 80% 70% / 0.55)" />
    </svg>
  );
};

export default Mascot;
