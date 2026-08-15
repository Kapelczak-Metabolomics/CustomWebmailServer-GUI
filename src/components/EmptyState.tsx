import { useTheme } from "../theme";

export default function EmptyState({
  icon,
  title,
  message,
}: {
  icon?: React.ReactNode;
  title: string;
  message: string;
}) {
  const t = useTheme().tokens;
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      {icon ? (
        <div className="mb-4" style={{ color: t.textFaint }}>
          {icon}
        </div>
      ) : null}
      <h3 className="text-base font-semibold mb-1" style={{ color: t.text }}>
        {title}
      </h3>
      <p className="text-sm max-w-md" style={{ color: t.textMuted }}>
        {message}
      </p>
    </div>
  );
}
