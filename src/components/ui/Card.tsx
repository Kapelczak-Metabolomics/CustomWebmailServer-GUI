import { type HTMLAttributes, forwardRef } from "react";
import { useTheme } from "../../theme";
import { cn } from "../../lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

export default forwardRef<HTMLDivElement, CardProps>(function Card(
  { hover = false, glow = false, className, style, children, ...props },
  ref,
) {
  const { tokens: t } = useTheme();
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl transition-all",
        hover && "hover-lift",
        glow && "card-glow",
        className,
      )}
      style={{
        backgroundColor: t.card,
        border: `1px solid ${t.cardBorder}`,
        boxShadow: t.shadowSm,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
});
