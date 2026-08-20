import { useMemo } from "react";
import Layout from "../components/Layout";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { formatRelative, getInitials } from "../lib/utils";
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Mail,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  const w = 80;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${h} ${points} ${w},${h}`}
        fill={color}
        opacity="0.1"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { tokens: t } = useTheme();
  const conversations = useStore((s) => s.conversations);
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const messages = useStore((s) => s.messages);

  const stats = useMemo(
    () => ({
      open: conversations.filter((c) => c.status === "open").length,
      pending: conversations.filter((c) => c.status === "pending").length,
      closed: conversations.filter((c) => c.status === "closed").length,
      urgent: conversations.filter(
        (c) => c.priority === "urgent" || c.priority === "high",
      ).length,
      total: conversations.length,
      contacts: contacts.length,
      users: users.length,
      messages: messages.length,
    }),
    [conversations, contacts, users, messages],
  );

  const recent = useMemo(
    () =>
      [...conversations]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [conversations],
  );

  // 14-day activity heatmap data
  const heatmapData = useMemo(() => {
    const days = 14;
    const data: { date: Date; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      date.setHours(0, 0, 0, 0);
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      const count = conversations.filter((c) => {
        const cd = new Date(c.createdAt);
        return cd >= date && cd < next;
      }).length;
      data.push({ date, count });
    }
    return data;
  }, [conversations]);

  // Team workload
  const workload = useMemo(() => {
    return users
      .filter((u) => u.role !== "customer")
      .map((u) => ({
        name: u.name,
        initials: getInitials(u.name),
        count: conversations.filter((c) => c.assigneeId === u.id).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [users, conversations]);

  const maxWorkload = Math.max(...workload.map((w) => w.count), 1);

  // Sparkline data (last 7 days counts)
  const sparkData = useMemo(() => {
    return heatmapData.slice(-7).map((d) => d.count);
  }, [heatmapData]);

  const StatCard = ({
    label,
    value,
    icon: Icon,
    accent,
    spark,
  }: {
    label: string;
    value: number | string;
    icon: any;
    accent?: string;
    spark?: number[];
  }) => (
    <div
      className="rounded-xl p-5 hover-lift transition-all relative overflow-hidden"
      style={{
        backgroundColor: t.card,
        border: `1px solid ${t.cardBorder}`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${accent || t.accent}, transparent)`,
        }}
      />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: t.textMuted }}>
          {label}
        </span>
        <div
          className="p-2.5 rounded-xl"
          style={{
            backgroundColor: (accent || t.accent) + "18",
            color: accent || t.accent,
                boxShadow: `0 4px 12px ${(accent || t.accent) + "30"}`,
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="text-2xl font-bold font-display" style={{ color: t.text }}>
          {value}
        </div>
        {spark && <Sparkline data={spark} color={accent || t.accent} />}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-6">
        <div className="mb-6 animate-fade-in-down">
          <h1
            className="text-2xl font-bold font-display mb-1"
            style={{ color: t.text }}
          >
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: t.textMuted }}>
            Welcome back — here's what's happening today.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="animate-fade-in-up" style={{ animationDelay: "0s" }}>
            <StatCard label="Open tickets" value={stats.open} icon={Inbox} spark={sparkData} />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
            <StatCard label="Pending" value={stats.pending} icon={Clock} accent="#F59E0B" spark={sparkData} />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <StatCard label="Closed" value={stats.closed} icon={CheckCircle2} accent="#10B981" spark={sparkData} />
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
            <StatCard label="Urgent / High" value={stats.urgent} icon={AlertCircle} accent="#EF4444" spark={sparkData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Recent conversations */}
          <div
            className="lg:col-span-2 rounded-xl p-5 animate-fade-in-up"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
              boxShadow: t.shadowSm,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                Recent conversations
              </h3>
              <TrendingUp className="w-4 h-4" style={{ color: t.textFaint }} />
            </div>
            <div className="space-y-2">
              {recent.map((c) => {
                const contact = contacts.find((x) => x.id === c.customerId);
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg transition-colors hover-lift"
                    style={{ backgroundColor: t.readLeftBg }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-semibold"
                          style={{
                            background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                            color: t.accent,
                          }}
                        >
                          {getInitials(contact?.name || c.customerId)}
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                          style={{
                            backgroundColor:
                              c.status === "open" ? "#10B981" : "#6B7A96",
                            borderColor: t.readLeftBg,
                          }}
                        />
                      </div>
                      <div>
                        <div
                          className="text-sm font-medium"
                          style={{ color: t.text }}
                        >
                          {c.subject}
                        </div>
                        <div className="text-xs" style={{ color: t.textMuted }}>
                          {contact?.name || c.customerId}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-[10px] px-2 py-0.5 rounded-full inline-block mb-1 font-medium"
                        style={{
                          backgroundColor:
                            c.status === "open" ? `${t.accent}22` : t.badgeBg,
                          color: c.status === "open" ? t.accent : t.textMuted,
                        }}
                      >
                        {c.status}
                      </div>
                      <div className="text-xs" style={{ color: t.textFaint }}>
                        {formatRelative(c.updatedAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
              {recent.length === 0 && (
                <div className="text-sm text-center py-8" style={{ color: t.textMuted }}>
                  No conversations yet.
                </div>
              )}
            </div>
          </div>

          {/* At a glance */}
          <div
            className="rounded-xl p-5 animate-fade-in-up"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
              boxShadow: t.shadowSm,
            }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: t.text }}>
              At a glance
            </h3>
            <div className="space-y-3">
              {[
                { icon: Mail, label: "Total tickets", value: stats.total },
                { icon: Users, label: "Contacts", value: stats.contacts },
                { icon: MessageSquare, label: "Messages", value: stats.messages },
                { icon: Users, label: "Team members", value: stats.users },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-2 rounded-lg"
                  style={{ backgroundColor: t.readLeftBg }}
                >
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: `${t.accent}18`,
                      color: t.accent,
                    }}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm flex-1" style={{ color: t.textSub }}>
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: t.text }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity heatmap + Team workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            className="rounded-xl p-5 animate-fade-in-up"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
              boxShadow: t.shadowSm,
            }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: t.text }}>
              Activity (last 14 days)
            </h3>
            <div className="flex gap-1.5 items-end h-16">
              {heatmapData.map((d, i) => {
                const intensity = d.count > 0 ? Math.min(d.count / 3, 1) : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md transition-all hover:opacity-80"
                    style={{
                      height: `${20 + intensity * 80}%`,
                      backgroundColor:
                        intensity > 0
                          ? `${t.accent}${Math.floor(intensity * 255).toString(16).padStart(2, "0")}`
                          : t.surface1,
                      minHeight: "8px",
                    }}
                    title={`${d.date.toLocaleDateString()}: ${d.count} tickets`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px]" style={{ color: t.textFaint }}>
              <span>14 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <div
            className="rounded-xl p-5 animate-fade-in-up"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
              boxShadow: t.shadowSm,
            }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: t.text }}>
              Team workload
            </h3>
            <div className="space-y-3">
              {workload.map((w) => (
                <div key={w.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                      color: t.accent,
                    }}
                  >
                    {w.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate" style={{ color: t.text }}>
                        {w.name}
                      </span>
                      <span className="text-xs" style={{ color: t.textMuted }}>
                        {w.count}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: t.surface1 }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(w.count / maxWorkload) * 100}%`,
                          background: t.accentGrad,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {workload.length === 0 && (
                <div className="text-sm text-center py-4" style={{ color: t.textMuted }}>
                  No team members yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
