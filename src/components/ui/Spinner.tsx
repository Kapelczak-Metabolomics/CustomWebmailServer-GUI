import { cn } from "../../lib/cn";

interface SpinnerProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function Spinner({
  size = 16,
  className,
  color = "#2896E8",
}: SpinnerProps) {
  return (
    <span
      className={cn("spinner", className)}
      style={{
        width: size,
        height: size,
        borderTopColor: color,
        borderWidth: Math.max(2, Math.floor(size / 8)),
      }}
    />
  );
}
