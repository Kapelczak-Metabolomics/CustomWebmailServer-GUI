import { type HTMLAttributes } from "react";
import { useTheme } from "../../theme";
import { cn } from "../../lib/cn";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
  dot?: boolean;
}

export default function Badge({
  color,
  dot = false,
  className,
  style,
  children,
  ...props
}: BadgeProps) {
  const { tokens: t } = useTheme();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full",
        className,
      )}
      style={{
        backgroundColor: color ? `${color}22` : t.badgeBg,
        color: color || t.badgeText,
        ...style,
      }}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color || t.accent }}
        />
      )}
      {children}
    </span>
  );
}
