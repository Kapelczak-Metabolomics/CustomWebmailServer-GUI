import { useTheme } from "../../theme";
import { useToastStore } from "./toastStore";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export default function ToastContainer() {
  const { tokens: t } = useTheme();
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => {
        const colors = {
          success: { bg: "#10B98122", color: "#10B981", icon: CheckCircle2 },
          error: { bg: "#EF444422", color: "#EF4444", icon: XCircle },
          info: { bg: `${t.accent}22`, color: t.accent, icon: Info },
        };
        const c = colors[toast.type];
        const Icon = c.icon;
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl animate-slide-in-right min-w-[260px] max-w-[400px]"
            style={{
              backgroundColor: t.elevated,
              border: `1px solid ${t.cardBorder}`,
              boxShadow: t.shadowMd,
            }}
          >
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: c.bg }}
            >
              <Icon className="w-4 h-4" style={{ color: c.color }} />
            </span>
            <span className="text-sm flex-1" style={{ color: t.text }}>
              {toast.message}
            </span>
            <button
              onClick={() => remove(toast.id)}
              className="flex-shrink-0"
              style={{ color: t.textFaint }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
