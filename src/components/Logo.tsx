import { Heart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className, size = 24 }: LogoProps) => {
  return (
    <div className={cn("relative inline-flex items-center gap-2", className)}>
      <div className="relative">
        <Heart
          className="text-primary animate-pulse"
          size={size}
          fill="currentColor"
        />
        <Clock 
          className="text-primary absolute -bottom-2 -right-2" 
          size={size * 0.6} 
        />
      </div>
      <span className="font-bold text-xl text-primary">
        Diabe<span className="relative">
          ticks
          <span className="absolute -top-1 -right-1 text-xs">⏰</span>
        </span>
      </span>
    </div>
  );
};

export default Logo;