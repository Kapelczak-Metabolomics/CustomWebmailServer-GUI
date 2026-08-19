import { cn } from "../../lib/cn";

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export default function Skeleton({
  className,
  width = "100%",
  height = "16px",
  rounded = "6px",
}: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", className)}
      style={{ width, height, borderRadius: rounded }}
    />
  );
}
