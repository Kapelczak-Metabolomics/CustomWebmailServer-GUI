import { useMemo } from "react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { formatRelative, getInitials, stripHtml } from "../lib/utils";
import LabelBadge from "./LabelBadge";
import { Icon } from "./Icon";
import { Search } from "lucide-react";

const statusIcon: Record<string, string> = {
  open: "○",
  pending: "◐",
  closed: "●",
  spam: "⚠",
};

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This week";
  return "Older";
}

const priorityColors: Record<string, string> = {
  urgent: "#EF4444",
  high: "#F59E0B",
  medium: "#6B7A96",
  low: "#6B7A96",
};

export default function ConversationList() {
  const { tokens: t } = useTheme();
  const search = useStore((s) => s.ui.search);
  const setSearch = useStore((s) => s.setSearch);
  const currentUser = useStore((s) => s.currentUser);
  const conversations = useStore((s) => s.conversations);
  const messages = useStore((s) => s.messages);
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const tags = useStore((s) => s.tags);
  const selectedId = useStore((s) => s.ui.selectedId);
  const selectConversation = useStore((s) => s.selectConversation);
  const toggleStar = useStore((s) => s.toggleStar);
  const folder = useStore((s) => s.ui.folder);

  const tagMap = useMemo(
    () => Object.fromEntries(tags.map((tag) => [tag.name, tag])),
    [tags],
  );

  const conversationsWithMeta = useMemo(() => {
    return conversations.map((c) => {
      const convMessages = messages
        .filter((m) => m.conversationId === c.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const last = convMessages[convMessages.length - 1];
      const contact = contacts.find((x) => x.id === c.customerId);
      const customerName = contact?.name || c.customerId;
      const preview = last ? stripHtml(last.bodyText || last.body) : c.subject;
      return { c, last, customerName, preview };
    });
  }, [conversations, contacts, messages]);

  const filtered = useMemo(() => {
    return conversationsWithMeta
      .filter(({ c }) => {
        if (folder === "starred") return c.starred;
        if (folder === "sent") return c.folder === "sent";
        return c.folder === folder;
      })
      .filter(({ c, last, customerName, preview }) => {
        const term = search.toLowerCase();
        if (!term) return true;
        return (
          c.subject.toLowerCase().includes(term) ||
          customerName.toLowerCase().includes(term) ||
          preview.toLowerCase().includes(term) ||
          (last && last.body.toLowerCase().includes(term)) ||
          c.labels.some((l) => l.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        if (a.c.starred !== b.c.starred) return a.c.starred ? -1 : 1;
        const aUnread = !a.c.readBy.includes(currentUser?.id || "") ? 1 : 0;
        const bUnread = !b.c.readBy.includes(currentUser?.id || "") ? 1 : 0;
        return bUnread - aUnread || b.c.updatedAt.localeCompare(a.c.updatedAt);
      });
  }, [conversationsWithMeta, currentUser, folder, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((item) => {
      const group = getDateGroup(item.c.updatedAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [filtered]);

  const groupOrder = ["Today", "Yesterday", "This week", "Older"];

  function handleSelect(id: string) {
    selectConversation(id);
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{
        backgroundColor: t.readLeftBg,
        borderRight: `1px solid ${t.divider}`,
      }}
    >
      <div
        className="px-4 py-3 border-b flex items-center gap-3"
        style={{ borderColor: t.divider }}
      >
        <div className="relative flex-1">
          <Search
            className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: t.textFaint }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl outline-none transition-all focus-ring"
            style={{
              backgroundColor: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              color: t.text,
            }}
          />
        </div>
      </div>

      <div
        className="flex items-center justify-between px-4 py-2 text-xs"
        style={{ color: t.textMuted }}
      >
        <span>{filtered.length} conversations</span>
        <span className="capitalize font-medium">{folder}</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div
            className="text-center p-8 text-sm"
            style={{ color: t.textMuted }}
          >
            No conversations found.
          </div>
        ) : (
          groupOrder.map((groupName) => {
            const items = grouped[groupName];
            if (!items || items.length === 0) return null;
            return (
              <div key={groupName}>
                <div
                  className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider sticky top-0 z-10"
                  style={{
                    color: t.textFaint,
                    backgroundColor: t.readLeftBg,
                  }}
                >
                  {groupName}
                </div>
                {items.map(({ c, customerName, preview, last }) => {
                  const unread = !c.readBy.includes(currentUser?.id || "");
                  const assignee = c.assigneeId
                    ? users.find((u) => u.id === c.assigneeId)
                    : null;
                  const priorityColor = priorityColors[c.priority] || t.textMuted;
                  return (
                    <div
                      key={c.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelect(c.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleSelect(c.id);
                        }
                      }}
                      className="w-full text-left px-4 py-3 border-b transition-all cursor-pointer relative group"
                      style={{
                        backgroundColor:
                          selectedId === c.id ? t.rowSelected : "transparent",
                        borderColor: t.divider,
                        borderLeft: unread
                          ? `3px solid ${t.accent}`
                          : "3px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedId !== c.id)
                          e.currentTarget.style.backgroundColor = t.rowHover;
                      }}
                      onMouseLeave={(e) => {
                        if (selectedId !== c.id)
                          e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                            style={{
                              background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                              color: t.accent,
                            }}
                          >
                            {getInitials(customerName)}
                          </div>
                          {unread && (
                            <span
                              className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                              style={{
                                backgroundColor: t.unreadDot,
                                borderColor: t.readLeftBg,
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span
                              className="text-sm truncate"
                              style={{
                                color: unread ? t.text : t.textSub,
                                fontWeight: unread ? 600 : 400,
                              }}
                            >
                              {customerName}
                            </span>
                            <span
                              className="text-[10px] whitespace-nowrap"
                              style={{ color: t.textMuted }}
                            >
                              {formatRelative(c.updatedAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className="text-xs truncate"
                              style={{
                                color: unread ? t.text : t.textSub,
                                fontWeight: unread ? 600 : 400,
                              }}
                            >
                              {c.subject}
                            </span>
                            {c.priority !== "medium" && (
                              <span
                                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0"
                                style={{
                                  backgroundColor: `${priorityColor}22`,
                                  color: priorityColor,
                                }}
                              >
                                <span
                                  className="w-1 h-1 rounded-full"
                                  style={{ backgroundColor: priorityColor }}
                                />
                                {c.priority.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs truncate mb-2"
                            style={{
                              color: t.textMuted,
                              opacity: 0.8,
                            }}
                          >
                            {preview}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className="text-[10px] font-medium"
                                style={{ color: t.textMuted }}
                              >
                                {statusIcon[c.status]} {c.status}
                              </span>
                              {c.labels
                                .slice(0, 2)
                                .map((label) =>
                                  tagMap[label] ? (
                                    <LabelBadge
                                      key={label}
                                      label={tagMap[label].name}
                                      color={tagMap[label].color}
                                    />
                                  ) : (
                                    <LabelBadge key={label} label={label} />
                                  ),
                                )}
                              {assignee && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{
                                    backgroundColor: `${t.accent}15`,
                                    color: t.accent,
                                  }}
                                  title={assignee.name}
                                >
                                  {assignee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(c.id);
                              }}
                              className="p-1 rounded transition-all hover:scale-110"
                              style={{
                                color: c.starred ? "#F59E0B" : t.textFaint,
                              }}
                            >
                              <span className={c.starred ? "animate-star-pop" : ""}>
                                <Icon.Star filled={c.starred} />
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
