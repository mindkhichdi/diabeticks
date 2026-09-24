import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
  /** "inverse" for use on the teal brand colour */
  tone?: "default" | "inverse";
}

/** A drop of blood with a tick in it — the reading, checked. */
export const LogoMark = ({ size = 32, className, tone = "default" }: LogoMarkProps) => (
  <svg width={size} height={size} viewBox="0 0 32 32" className={cn("shrink-0", className)} aria-hidden="true">
    <path
      d="M16 2.5C16 2.5 5.5 14.2 5.5 20.5a10.5 10.5 0 0 0 21 0C26.5 14.2 16 2.5 16 2.5Z"
      className={tone === "inverse" ? "fill-primary-foreground" : "fill-primary"}
    />
    <path
      d="M11 20.8l3.4 3.4 6.6-7.2"
      fill="none"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={tone === "inverse" ? "stroke-primary" : "stroke-primary-foreground"}
    />
  </svg>
);

interface LogoProps extends LogoMarkProps {
  /** Hide the wordmark, e.g. in tight spaces */
  markOnly?: boolean;
}

const Logo = ({ className, size = 32, tone = "default", markOnly = false }: LogoProps) => (
  <span className={cn("inline-flex items-center gap-2", className)}>
    <LogoMark size={size} tone={tone} />
    {!markOnly && (
      <span
        className={cn(
          "font-display font-bold tracking-tight leading-none",
          tone === "inverse" ? "text-primary-foreground" : "text-foreground",
        )}
        style={{ fontSize: size * 0.72 }}
      >
        Diabe<span className={tone === "inverse" ? "opacity-70" : "text-primary"}>ticks</span>
      </span>
    )}
  </span>
);

export default Logo;
