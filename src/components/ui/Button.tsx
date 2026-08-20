import { type ButtonHTMLAttributes, forwardRef } from "react";
import { useTheme } from "../../theme";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export default forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    className,
    children,
    style,
    ...props
  },
  ref,
) {
  const { tokens: t } = useTheme();

  const sizes: Record<Size, string> = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-5 py-2.5 text-sm rounded-xl",
  };

  const variants: Record<Variant, React.CSSProperties> = {
    primary: {
      background: t.accentGrad,
      color: "#fff",
      boxShadow: t.shadowSm,
    },
    secondary: {
      backgroundColor: t.btnSecBg,
      border: `1px solid ${t.btnSecBorder}`,
      color: t.btnSecText,
    },
    ghost: {
      backgroundColor: "transparent",
      color: t.textSub,
    },
    danger: {
      backgroundColor: "#EF4444",
      color: "#fff",
    },
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed focus-ring",
        sizes[size],
        className,
      )}
      style={{ ...variants[variant], ...style }}
      {...props}
    >
      {loading && <span className="spinner" style={{ borderTopColor: "#fff" }} />}
      {children}
    </button>
  );
});
