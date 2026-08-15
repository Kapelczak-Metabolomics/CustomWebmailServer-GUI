import { useMemo } from "react"
import Layout from "../components/Layout"
import { useTheme } from "../theme"
import { useStore } from "../store"
import { formatRelative, getInitials } from "../lib/utils"
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Mail,
  MessageSquare,
} from "lucide-react"

export default function DashboardPage() {
  const { tokens: t } = useTheme()
  const conversations = useStore((s) => s.conversations)
  const contacts = useStore((s) => s.contacts)
  const users = useStore((s) => s.users)
  const messages = useStore((s) => s.messages)

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
  )

  const recent = useMemo(
    () =>
      [...conversations]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [conversations],
  )

  const Card = ({
    label,
    value,
    icon: Icon,
    accent,
  }: {
    label: string
    value: number | string
    icon: any
    accent?: string
  }) => (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: t.card, border: `1px solid ${t.cardBorder}` }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: t.textMuted }}>
          {label}
        </span>
        <div
          className="p-2 rounded-lg"
          style={{
            backgroundColor: (accent || t.accent) + "20",
            color: accent || t.accent,
          }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold" style={{ color: t.text }}>
        {value}
      </div>
    </div>
  )

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-6">
        <h1 className="text-xl font-semibold mb-6" style={{ color: t.text }}>
          Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card label="Open tickets" value={stats.open} icon={Inbox} />
          <Card label="Pending" value={stats.pending} icon={Clock} />
          <Card label="Closed today" value={stats.closed} icon={CheckCircle2} />
          <Card
            label="Urgent / High"
            value={stats.urgent}
            icon={AlertCircle}
            accent="#EF4444"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            className="lg:col-span-2 rounded-xl p-5"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: t.text }}
            >
              Recent conversations
            </h3>
            <div className="space-y-2">
              {recent.map((c) => {
                const contact = contacts.find((x) => x.id === c.customerId)
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: t.readLeftBg }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold"
                        style={{
                          background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                          color: t.accent,
                        }}
                      >
                        {getInitials(contact?.name || c.customerId)}
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
                        className="text-[10px] px-2 py-0.5 rounded-full inline-block mb-1"
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
                )
              })}
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: t.text }}
            >
              At a glance
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4" style={{ color: t.accent }} />
                <span className="text-sm" style={{ color: t.textSub }}>
                  {stats.total} total tickets
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" style={{ color: t.accent }} />
                <span className="text-sm" style={{ color: t.textSub }}>
                  {stats.contacts} contacts
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MessageSquare
                  className="w-4 h-4"
                  style={{ color: t.accent }}
                />
                <span className="text-sm" style={{ color: t.textSub }}>
                  {stats.messages} messages
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" style={{ color: t.accent }} />
                <span className="text-sm" style={{ color: t.textSub }}>
                  {stats.users} team members
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
