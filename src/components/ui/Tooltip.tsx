import { type HTMLAttributes } from "react";
import { useTheme } from "../../theme";
import { cn } from "../../lib/cn";

interface TooltipProps extends HTMLAttributes<HTMLDivElement> {
  text: string;
  position?: "top" | "bottom" | "left" | "right";
}

export default function Tooltip({
  text,
  position = "top",
  className,
  children,
  ...props
}: TooltipProps) {
  const { tokens: t } = useTheme();
  const posClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };
  return (
    <div className="relative inline-flex group" {...props}>
      {children}
      <div
        className={cn(
          "absolute z-50 px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
          posClasses[position],
        )}
        style={{
          backgroundColor: t.elevated,
          color: t.text,
          border: `1px solid ${t.cardBorder}`,
          boxShadow: t.shadowSm,
        }}
      >
        {text}
      </div>
    </div>
  );
}
