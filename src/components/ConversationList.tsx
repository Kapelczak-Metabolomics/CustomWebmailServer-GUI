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
  const markRead = useStore((s) => s.markRead);
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

  function handleSelect(id: string) {
    selectConversation(id);
    if (currentUser) markRead(id, currentUser.id);
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
            className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: t.textFaint }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
            style={{
              backgroundColor: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              color: t.text,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = t.accent;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = t.inputBorder;
            }}
          />
        </div>
      </div>

      <div
        className="flex items-center justify-between px-4 py-2 text-xs"
        style={{ color: t.textMuted }}
      >
        <span>{filtered.length} conversations</span>
        <span className="capitalize">{folder}</span>
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
          filtered.map(({ c, customerName, preview, last }) => {
            const unread = !c.readBy.includes(currentUser?.id || "");
            const assignee = c.assigneeId
              ? users.find((u) => u.id === c.assigneeId)
              : null;
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
                className="w-full text-left px-4 py-3 border-b transition-colors cursor-pointer"
                style={{
                  backgroundColor:
                    selectedId === c.id ? t.rowSelected : "transparent",
                  borderColor: t.divider,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{
                      background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                      color: t.accent,
                    }}
                  >
                    {getInitials(customerName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: unread ? t.text : t.textSub }}
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
                        className="text-xs font-semibold truncate"
                        style={{ color: t.text }}
                      >
                        {c.subject}
                      </span>
                      {c.priority === "high" && (
                        <span
                          className="text-[9px] font-semibold px-1 rounded"
                          style={{
                            backgroundColor: "#EF444422",
                            color: "#EF4444",
                          }}
                        >
                          HIGH
                        </span>
                      )}
                      {c.priority === "urgent" && (
                        <span
                          className="text-[9px] font-semibold px-1 rounded"
                          style={{
                            backgroundColor: "#EF444422",
                            color: "#EF4444",
                          }}
                        >
                          URGENT
                        </span>
                      )}
                      {c.priority === "low" && (
                        <span
                          className="text-[9px] font-semibold px-1 rounded"
                          style={{
                            backgroundColor: t.badgeBg,
                            color: t.textMuted,
                          }}
                        >
                          LOW
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs truncate mb-2"
                      style={{ color: t.textMuted }}
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
                          .slice(0, 3)
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
                            className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: t.badgeBg,
                              color: t.textSub,
                            }}
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
                        className="p-1 rounded transition-colors"
                        style={{ color: c.starred ? "#F59E0B" : t.textFaint }}
                      >
                        <Icon.Star filled={c.starred} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
