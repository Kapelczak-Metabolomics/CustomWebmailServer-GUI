import { useMemo } from "react";
import Layout from "../components/Layout";
import { useTheme } from "../theme";
import { useStore } from "../store";

export default function ReportsPage() {
  const { tokens: t } = useTheme();
  const conversations = useStore((s) => s.conversations);
  const messages = useStore((s) => s.messages);
  const mailboxes = useStore((s) => s.mailboxes);

  const byStatus = useMemo(() => {
    const s: Record<string, number> = {};
    conversations.forEach((c) => {
      s[c.status] = (s[c.status] || 0) + 1;
    });
    return s;
  }, [conversations]);

  const byPriority = useMemo(() => {
    const s: Record<string, number> = {};
    conversations.forEach((c) => {
      s[c.priority] = (s[c.priority] || 0) + 1;
    });
    return s;
  }, [conversations]);

  const byMailbox = useMemo(() => {
    const s: Record<string, number> = {};
    conversations.forEach((c) => {
      const m = mailboxes.find((x) => x.id === c.mailboxId)?.name || "Unknown";
      s[m] = (s[m] || 0) + 1;
    });
    return s;
  }, [conversations, mailboxes]);

  const max = Math.max(...Object.values(byStatus), 1);

  function BarChart(
    title: string,
    data: Record<string, number>,
    color?: string,
  ) {
    return (
      <div
        className="rounded-xl p-5 mb-6"
        style={{ backgroundColor: t.card, border: `1px solid ${t.cardBorder}` }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: t.text }}>
          {title}
        </h3>
        <div className="space-y-3">
          {Object.entries(data).map(([label, value]) => {
            const pct = max ? (value / max) * 100 : 0;
            return (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-xs" style={{ color: t.textMuted }}>
                  {label}
                </span>
                <div
                  className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: t.inputBg }}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: color || t.accent,
                    }}
                  />
                </div>
                <span
                  className="w-6 text-right text-xs"
                  style={{ color: t.text }}
                >
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-6">
        <h1 className="text-xl font-semibold mb-6" style={{ color: t.text }}>
          Reports
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="text-xs" style={{ color: t.textMuted }}>
              Total tickets
            </div>
            <div className="text-2xl font-semibold" style={{ color: t.text }}>
              {conversations.length}
            </div>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="text-xs" style={{ color: t.textMuted }}>
              Total messages
            </div>
            <div className="text-2xl font-semibold" style={{ color: t.text }}>
              {messages.length}
            </div>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="text-xs" style={{ color: t.textMuted }}>
              Avg resolution
            </div>
            <div className="text-2xl font-semibold" style={{ color: t.text }}>
              ~2h
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {BarChart("Tickets by status", byStatus, t.accent)}
          {BarChart("Tickets by priority", byPriority, "#EF4444")}
          {BarChart("Tickets by mailbox", byMailbox, "#10B981")}
        </div>
      </div>
    </Layout>
  );
}
