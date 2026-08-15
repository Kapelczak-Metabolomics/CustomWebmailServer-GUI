import { getInitials } from "../lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  size?: Size;
  color?: string;
  className?: string;
}

const sizeClass: Record<Size, string> = {
  sm: "w-7 h-7 text-[11px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
  xl: "w-14 h-14 text-base",
};

const palette = [
  "#2896E8",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#0EA5E9",
  "#6366F1",
];

function stringColor(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

export default function Avatar({
  name,
  size = "md",
  color,
  className = "",
}: AvatarProps) {
  const initials = getInitials(name);
  const c = color || stringColor(name);
  return (
    <div
      className={`${sizeClass[size]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
      style={{
        backgroundColor: `${c}30`,
        color: c,
        border: `1px solid ${c}50`,
      }}
    >
      {initials}
    </div>
  );
}
