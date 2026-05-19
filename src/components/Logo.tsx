import { cn } from "@/lib/utils";
import Mascot from "./Mascot";

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo = ({ className, size = 36 }: LogoProps) => {
  return (
    <div className={cn("relative inline-flex items-center gap-2", className)}>
      <Mascot size={size} />
      <span className="font-extrabold text-xl sm:text-2xl text-primary tracking-tight">
        Diabeticks
      </span>
    </div>
  );
};

export default Logo;
