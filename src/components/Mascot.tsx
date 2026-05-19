import { cn } from "@/lib/utils";

interface MascotProps {
  className?: string;
  size?: number;
  mood?: "happy" | "excited" | "wave" | "cheer";
}

/**
 * "Pip" — a cute lavender bunny mascot in a scrapbook sketch style.
 */
const Mascot = ({ className, size = 96, mood = "happy" }: MascotProps) => {
  const waving = mood === "wave" || mood === "cheer";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 130"
      className={cn(className)}
      aria-hidden="true"
    >
      {/* Ears outer */}
      <ellipse cx="44" cy="22" rx="9" ry="20" fill="hsl(271 50% 78%)" stroke="hsl(271 35% 35%)" strokeWidth="1.6" />
      <ellipse cx="76" cy="22" rx="9" ry="20" fill="hsl(271 50% 78%)" stroke="hsl(271 35% 35%)" strokeWidth="1.6" />
      {/* Ears inner */}
      <ellipse cx="44" cy="24" rx="4" ry="13" fill="hsl(340 75% 88%)" />
      <ellipse cx="76" cy="24" rx="4" ry="13" fill="hsl(340 75% 88%)" />

      {/* Body */}
      <ellipse cx="60" cy="92" rx="32" ry="26" fill="hsl(271 55% 86%)" stroke="hsl(271 35% 35%)" strokeWidth="1.8" />
      {/* Belly */}
      <ellipse cx="60" cy="96" rx="18" ry="16" fill="hsl(340 70% 94%)" />

      {/* Arms */}
      <ellipse
        cx="28"
        cy="86"
        rx="8"
        ry="12"
        fill="hsl(271 55% 82%)"
        stroke="hsl(271 35% 35%)"
        strokeWidth="1.6"
        className={waving ? "animate-wiggle" : ""}
        style={{ transformBox: "fill-box", transformOrigin: "50% 10%" }}
      />
      <ellipse cx="92" cy="92" rx="8" ry="12" fill="hsl(271 55% 82%)" stroke="hsl(271 35% 35%)" strokeWidth="1.6" />

      {/* Feet */}
      <ellipse cx="46" cy="120" rx="10" ry="5" fill="hsl(340 70% 88%)" stroke="hsl(271 35% 35%)" strokeWidth="1.6" />
      <ellipse cx="74" cy="120" rx="10" ry="5" fill="hsl(340 70% 88%)" stroke="hsl(271 35% 35%)" strokeWidth="1.6" />

      {/* Head */}
      <circle cx="60" cy="56" r="30" fill="hsl(271 55% 90%)" stroke="hsl(271 35% 35%)" strokeWidth="1.8" />

      {/* Cheeks */}
      <circle cx="40" cy="62" r="5" fill="hsl(340 80% 78%)" opacity="0.75" />
      <circle cx="80" cy="62" r="5" fill="hsl(340 80% 78%)" opacity="0.75" />

      {/* Eyes */}
      <circle cx="49" cy="52" r="3.5" fill="hsl(271 35% 22%)" />
      <circle cx="71" cy="52" r="3.5" fill="hsl(271 35% 22%)" />
      <circle cx="50" cy="51" r="1.3" fill="#fff" />
      <circle cx="72" cy="51" r="1.3" fill="#fff" />

      {/* Tiny nose */}
      <path d="M57 60 Q60 63 63 60 Q60 64 57 60 Z" fill="hsl(340 75% 65%)" stroke="hsl(271 35% 35%)" strokeWidth="1" />

      {/* Smile */}
      <path
        d="M54 66 Q60 71 66 66"
        stroke="hsl(271 35% 25%)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />

      {/* Sketch sparkle */}
      <path d="M22 40 L24 46 L30 48 L24 50 L22 56 L20 50 L14 48 L20 46 Z" fill="hsl(45 90% 70%)" opacity="0.9" />
    </svg>
  );
};

export default Mascot;
