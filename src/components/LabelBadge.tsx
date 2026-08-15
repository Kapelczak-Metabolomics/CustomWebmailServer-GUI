interface LabelBadgeProps {
  label: string
  color?: string
  onRemove?: () => void
}

const palette: Record<string, string> = {
  Important: "#EF4444",
  Finance: "#F59E0B",
  Design: "#8B5CF6",
  Engineering: "#10B981",
  Partnership: "#2896E8",
  Urgent: "#EF4444",
  High: "#F59E0B",
  Medium: "#8B5CF6",
  Low: "#6B7A96",
}

export default function LabelBadge({
  label,
  color,
  onRemove,
}: LabelBadgeProps) {
  const c = color || palette[label] || "#6B7A96"
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{
        backgroundColor: `${c}22`,
        color: c,
        border: `1px solid ${c}40`,
      }}
    >
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  )
}
