import { cn } from "@/lib/utils";

/**
 * Hand-drawn scrapbook sketches: stars, hearts, arrows, squiggles.
 * Pure SVG — use as decorative accents around bento cards.
 */

export const SketchStar = ({ className, size = 28 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path
      d="M16 3 L19 12 L29 13 L21 19 L24 29 L16 23 L8 29 L11 19 L3 13 L13 12 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
);

export const SketchHeart = ({ className, size = 28 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path
      d="M16 27 C 6 20 3 13 8 8 C 12 4 15 6 16 9 C 17 6 20 4 24 8 C 29 13 26 20 16 27 Z"
      fill="currentColor"
      fillOpacity="0.18"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const SketchArrow = ({ className, size = 60 }: { className?: string; size?: number }) => (
  <svg width={size} height={size / 2} viewBox="0 0 60 30" className={className} aria-hidden="true">
    <path
      d="M4 24 Q 18 4 40 12 Q 50 16 54 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path d="M48 6 L54 10 L50 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SketchSquiggle = ({ className, size = 80 }: { className?: string; size?: number }) => (
  <svg width={size} height={12} viewBox="0 0 80 12" className={className} aria-hidden="true">
    <path
      d="M2 6 Q 10 0 18 6 T 34 6 T 50 6 T 66 6 T 78 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const SketchSparkle = ({ className, size = 18 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" className={className} aria-hidden="true">
    <path d="M10 1 L11 9 L19 10 L11 11 L10 19 L9 11 L1 10 L9 9 Z" fill="currentColor" />
  </svg>
);

export const SketchSun = ({ className, size = 56 }: { className?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" className={className} aria-hidden="true">
    <circle cx="30" cy="30" r="10" fill="none" stroke="currentColor" strokeWidth="1.6" />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * Math.PI) / 4;
      const x1 = 30 + Math.cos(a) * 16;
      const y1 = 30 + Math.sin(a) * 16;
      const x2 = 30 + Math.cos(a) * 24;
      const y2 = 30 + Math.sin(a) * 24;
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />;
    })}
  </svg>
);

export const SketchCloud = ({ className, size = 70 }: { className?: string; size?: number }) => (
  <svg width={size} height={size * 0.6} viewBox="0 0 70 42" className={className} aria-hidden="true">
    <path
      d="M14 32 Q 4 32 6 22 Q 8 14 18 16 Q 20 6 32 8 Q 44 6 46 18 Q 58 16 60 26 Q 64 36 52 36 L 18 36 Q 12 36 14 32 Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  </svg>
);

export const Sticker = ({
  emoji,
  className,
  rotate = -8,
}: { emoji: string; className?: string; rotate?: number }) => (
  <div
    className={cn(
      "inline-flex items-center justify-center w-10 h-10 rounded-full bg-card border-2 border-primary/40 text-lg shadow-md",
      className,
    )}
    style={{ transform: `rotate(${rotate}deg)` }}
  >
    {emoji}
  </div>
);
