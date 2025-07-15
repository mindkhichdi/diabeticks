import { Heart, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className, size = 24 }: LogoProps) => {
  return (
    <div className={cn("relative inline-flex items-center gap-2", className)}>
      <Heart
        className="text-primary animate-pulse"
        size={size}
        fill="currentColor"
      />
      <Activity className="text-primary" size={size} />
      <span className="font-bold text-xl text-primary">Diabeticks</span>
    </div>
  );
};

export default Logo;