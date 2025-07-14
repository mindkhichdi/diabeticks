import { Heart, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
  variant?: "default" | "full";
}

const Logo = ({ className, size = 24, variant = "default" }: LogoProps) => {
  return (
    <div className={cn("relative inline-flex items-center gap-3", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-30 animate-pulse"></div>
        <div className="relative bg-gradient-primary rounded-2xl p-3 shadow-glow animate-float">
          <Heart
            className="text-white drop-shadow-lg"
            size={size}
            fill="currentColor"
          />
          <Sparkles 
            className="absolute -top-1 -right-1 text-accent animate-bounce" 
            size={size * 0.4} 
          />
        </div>
      </div>
      
      {variant === "full" && (
        <div className="flex flex-col">
          <span className="font-black text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Diabeticks
          </span>
          <span className="text-xs text-muted-foreground font-medium tracking-wider">
            Health Companion
          </span>
        </div>
      )}
      
      {variant === "default" && (
        <span className="font-black text-xl bg-gradient-primary bg-clip-text text-transparent flex items-center gap-1">
          Diabeticks
          <Zap className="text-accent animate-wiggle" size={size * 0.6} />
        </span>
      )}
    </div>
  );
};

export default Logo;