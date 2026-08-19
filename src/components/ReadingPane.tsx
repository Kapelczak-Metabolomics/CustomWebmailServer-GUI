import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import {
  formatDate,
  formatTime,
  formatBytes,
  getInitials,
  stripHtml,
} from "../lib/utils";
import { api } from "../lib/api";
import EmptyState from "./EmptyState";
import Avatar from "./Avatar";
import LabelBadge from "./LabelBadge";
import { Icon } from "./Icon";
import {
  Inbox,
  MessageSquareWarning,
  Trash,
  Archive,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Tag as TagIcon,
  Paperclip,
  Send,
  Plus,
  X,
  ChevronDown,
  ChevronLeft,
  Reply,
  MoreHorizontal,
} from "lucide-react";

function toHtml(text: string) {
  return text
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

export default function ReadingPane() {
  const { tokens: t } = useTheme();
  const selectedId = useStore((s) => s.ui.selectedId);
  const currentUser = useStore((s) => s.currentUser);
  const conversations = useStore((s) => s.conversations);
  const messages = useStore((s) => s.messages);
  const contacts = useStore((s) => s.contacts);
  const users = useStore((s) => s.users);
  const tags = useStore((s) => s.tags);
  const savedReplies = useStore((s) => s.savedReplies);
  const mailboxes = useStore((s) => s.mailboxes);

  const setStatus = useStore((s) => s.setStatus);
  const setPriority = useStore((s) => s.setPriority);
  const assign = useStore((s) => s.assign);
  const changeFolder = useStore((s) => s.changeFolder);
  const addTagToConversation = useStore((s) => s.addTagToConversation);
  const removeTagFromConversation = useStore(
    (s) => s.removeTagFromConversation,
  );
  const sendReply = useStore((s) => s.sendReply);
  const sendMessage = useStore((s) => s.sendMessage);
  const selectConversation = useStore((s) => s.selectConversation);
  const toggleStar = useStore((s) => s.toggleStar);
  const followConversation = useStore((s) => s.followConversation);
  const unfollowConversation = useStore((s) => s.unfollowConversation);
  const snoozeConversation = useStore((s) => s.snoozeConversation);
  const forwardConversation = useStore((s) => s.forwardConversation);

  const [replyText, setReplyText] = useState("");
  const [replyMode, setReplyMode] = useState<"reply" | "note">("reply");
  const [pendingAttachments, setPendingAttachments] = useState<
    {
      name: string;
      url: string;
    }[]
  >([]);

  useEffect(() => {
    setReplyText("");
    setReplyMode("reply");
    setPendingAttachments([]);
  }, [selectedId]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [showForward, setShowForward] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [fwdTo, setFwdTo] = useState("");
  const [fwdNote, setFwdNote] = useState("");
  const [snoozeDate, setSnoozeDate] = useState("");

  const conversation = useMemo(
    () => conversations.find((c) => c.id === selectedId),
    [conversations, selectedId],
  );
  const convMessages = useMemo(
    () =>
      messages
        .filter((m) => m.conversationId === selectedId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages, selectedId],
  );

  if (!conversation)
    return (
      <EmptyState
        icon={<Inbox className="w-12 h-12" />}
        title="No conversation selected"
        message="Select a conversation from the list to view messages and reply."
      />
    );

  const conv = conversation;

  const customer = contacts.find((c) => c.id === conv.customerId);
  const customerName = customer?.name || conv.customerId;
  const mailbox = mailboxes.find((m) => m.id === conv.mailboxId);
  const assignee = conv.assigneeId
    ? users.find((u) => u.id === conv.assigneeId)
    : null;
  const tagMap = Object.fromEntries(tags.map((tag) => [tag.name, tag]));

  function attachmentHtml() {
    if (!pendingAttachments.length) return "";
    return pendingAttachments
      .map(
        (a) =>
          `<p><a href="${a.url}" target="_blank" rel="noopener noreferrer">${a.name}</a></p>`,
      )
      .join("");
  }

  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { name, url } = await api.uploadAttachment(file);
      setPendingAttachments((prev) => [...prev, { name, url }]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload attachment");
    }
  }

  function handleSend(andClose = false) {
    if (!replyText.trim() && !pendingAttachments.length) return;
    const attachments = attachmentHtml();
    if (replyMode === "reply")
      sendReply(conv.id, toHtml(replyText.trim()) + attachments);
    else
      sendMessage(conv.id, {
        type: "note",
        body: `<p>${replyText.trim()}</p>` + attachments,
        authorType: "agent",
      });
    setReplyText("");
    setPendingAttachments([]);
    if (andClose) setStatus(conv.id, "closed");
  }

  async function handleForward() {
    if (!fwdTo.trim()) return;
    await forwardConversation(conv.id, fwdTo.trim(), fwdNote.trim());
    setFwdTo("");
    setFwdNote("");
    setShowForward(false);
  }

  async function handleSnooze() {
    if (!snoozeDate) return;
    const until = new Date(snoozeDate).toISOString();
    await snoozeConversation(conv.id, until);
    setShowSnooze(false);
    setSnoozeDate("");
  }

  async function handleTagSelect(name: string) {
    const existing = tags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) await addTagToConversation(conv.id, existing.id);
    else {
      const tag = await useStore.getState().createTag(name, "#6B7A96");
      if (tag) await addTagToConversation(conv.id, tag.id);
    }
    setShowTagMenu(false);
    setNewTagInput("");
  }

  const MessageBubble = ({ msg }: { msg: (typeof messages)[0] }) => {
    const author =
      users.find((u) => u.id === msg.authorId) ||
      contacts.find((c) => c.id === msg.authorId);
    const isMe = msg.authorId === currentUser?.id;
    const isNote = msg.type === "note";
    return (
      <div className={`flex gap-3 mb-6 ${isMe ? "flex-row-reverse" : ""}`}>
        <div className="flex-shrink-0">
          <Avatar
            name={author?.name || "Unknown"}
            size="md"
            color={isNote ? "#F59E0B" : undefined}
          />
        </div>
        <div
          className={`flex-1 min-w-0 flex flex-col ${
            isMe ? "items-end" : "items-start"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold" style={{ color: t.text }}>
              {author?.name || "Unknown"}
            </span>
            <span className="text-[10px]" style={{ color: t.textMuted }}>
              {formatDate(msg.createdAt)} {formatTime(msg.createdAt)}
            </span>
            {msg.type === "note" && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "#F59E0B22", color: "#F59E0B" }}
              >
                Internal note
              </span>
            )}
          </div>
          <div className="w-fit max-w-full">
            <div
              className="text-sm leading-relaxed px-4 py-3 rounded-2xl"
              style={{
                backgroundColor: isMe
                  ? t.accent
                  : isNote
                    ? "#F59E0B11"
                    : t.readMain,
                color: isMe ? "#fff" : t.text,
                border: `1px solid ${
                  isMe ? t.accent : isNote ? "#F59E0B44" : t.divider
                }`,
              }}
              dangerouslySetInnerHTML={{ __html: msg.body }}
            />
            {msg.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {msg.attachments.map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    download
                    className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg"
                    style={{ backgroundColor: t.inputBg, color: t.textSub }}
                  >
                    <Paperclip className="w-3 h-3" /> {a.name}{" "}
                    <span style={{ color: t.textMuted }}>
                      ({formatBytes(a.size)})
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="flex flex-col h-full w-full flex-1"
      style={{ backgroundColor: t.readMain }}
    >
      <div
        className="flex items-start justify-between px-6 py-4 border-b"
        style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => selectConversation(null)}
              className="md:hidden p-1 rounded -ml-1"
              style={{ color: t.textSub }}
              aria-label="Back to list"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold" style={{ color: t.text }}>
              {conv.subject}
            </h2>
            <button
              onClick={() => toggleStar(conv.id)}
              style={{ color: conv.starred ? "#F59E0B" : t.textFaint }}
            >
              <Icon.Star filled={conv.starred} />
            </button>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full"
              style={{ backgroundColor: t.badgeBg, color: t.textMuted }}
            >
              #{conv.number}
            </span>
            {conv.snoozeUntil && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#8B5CF622", color: "#8B5CF6" }}
              >
                Snoozed until {formatDate(conv.snoozeUntil)}
              </span>
            )}
            <button
              onClick={() =>
                conv.followers.includes(currentUser?.id || "")
                  ? unfollowConversation(conv.id)
                  : followConversation(conv.id)
              }
              className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{
                backgroundColor: conv.followers.includes(currentUser?.id || "")
                  ? `${t.accent}22`
                  : t.badgeBg,
                color: conv.followers.includes(currentUser?.id || "")
                  ? t.accent
                  : t.textMuted,
              }}
            >
              {conv.followers.includes(currentUser?.id || "")
                ? "Following"
                : "Follow"}
            </button>
          </div>
          <div
            className="flex flex-wrap items-center gap-3 text-xs"
            style={{ color: t.textMuted }}
          >
            <span>
              From <strong style={{ color: t.text }}>{customerName}</strong>
            </span>
            <span>
              to <strong style={{ color: t.text }}>{mailbox?.email}</strong>
            </span>
            <span>{convMessages.length} messages</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          <button
            onClick={() => setReplyMode("reply")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: t.accent, color: "#fff" }}
          >
            <Reply className="w-3.5 h-3.5" /> Reply
          </button>
          <button
            onClick={() => setShowMore((v) => !v)}
            className="relative p-2 rounded-lg"
            style={{ color: t.textSub, backgroundColor: t.inputBg }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {showMore && (
            <div
              className="absolute right-6 top-16 w-48 rounded-xl z-40"
              style={{
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.shadow,
              }}
            >
              <button
                onClick={() => {
                  setShowSnooze(true);
                  setShowMore(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
                style={{ color: t.textSub }}
              >
                <Clock className="w-3.5 h-3.5" /> Snooze
              </button>
              <button
                onClick={() => {
                  setShowForward(true);
                  setShowMore(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
                style={{ color: t.textSub }}
              >
                <Icon.Forward /> Forward
              </button>
              <button
                onClick={() => {
                  changeFolder(conv.id, "archive");
                  setShowMore(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
                style={{ color: t.textSub }}
              >
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
              <button
                onClick={() => {
                  setStatus(
                    conv.id,
                    conv.status === "closed" ? "open" : "closed",
                  );
                  setShowMore(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
                style={{ color: t.textSub }}
              >
                {conv.status === "closed" ? (
                  <Circle className="w-3.5 h-3.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}{" "}
                {conv.status === "closed" ? "Reopen" : "Close"}
              </button>
              <button
                onClick={() => {
                  setStatus(conv.id, "spam");
                  changeFolder(conv.id, "spam");
                  setShowMore(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
                style={{ color: t.textSub }}
              >
                <MessageSquareWarning className="w-3.5 h-3.5" /> Mark spam
              </button>
              <button
                onClick={() => {
                  changeFolder(conv.id, "trash");
                  setShowMore(false);
                }}
                className="w-full text-left px-3 py-2 text-xs flex items-center gap-2"
                style={{ color: "#EF4444" }}
              >
                <Trash className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex items-center gap-3 px-6 py-2 border-b flex-wrap"
        style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
      >
        <div className="flex items-center gap-1.5 text-xs">
          <span style={{ color: t.textMuted }}>Status</span>
          <select
            value={conv.status}
            onChange={(e) => setStatus(conv.id, e.target.value as any)}
            className="px-2 py-1 rounded-md text-xs font-medium outline-none cursor-pointer"
            style={{
              backgroundColor: t.inputBg,
              color: t.text,
              border: `1px solid ${t.inputBorder}`,
            }}
          >
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="spam">Spam</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span style={{ color: t.textMuted }}>Priority</span>
          <select
            value={conv.priority}
            onChange={(e) => setPriority(conv.id, e.target.value as any)}
            className="px-2 py-1 rounded-md text-xs font-medium outline-none cursor-pointer"
            style={{
              backgroundColor: t.inputBg,
              color: t.text,
              border: `1px solid ${t.inputBorder}`,
            }}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <User className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
          <select
            value={conv.assigneeId || ""}
            onChange={(e) => assign(conv.id, e.target.value || undefined)}
            className="px-2 py-1 rounded-md text-xs font-medium outline-none cursor-pointer"
            style={{
              backgroundColor: t.inputBg,
              color: t.text,
              border: `1px solid ${t.inputBorder}`,
            }}
          >
            <option value="">Unassigned</option>
            {users
              .filter((u) => u.role !== "customer")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5 relative">
          <TagIcon className="w-3.5 h-3.5" style={{ color: t.textMuted }} />
          {conv.labels.map((label) =>
            tagMap[label] ? (
              <LabelBadge
                key={label}
                label={tagMap[label].name}
                color={tagMap[label].color}
                onRemove={() =>
                  removeTagFromConversation(conv.id, tagMap[label].id)
                }
              />
            ) : (
              <LabelBadge key={label} label={label} onRemove={() => {}} />
            ),
          )}
          <button
            onClick={() => setShowTagMenu((v) => !v)}
            className="p-1 rounded-md"
            style={{ color: t.textSub, backgroundColor: t.inputBg }}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          {showTagMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl z-40 p-2"
              style={{
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
                boxShadow: t.shadow,
              }}
            >
              <div
                className="text-[10px] uppercase tracking-wider mb-1 px-1"
                style={{ color: t.textMuted }}
              >
                Add tag
              </div>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagSelect(tag.name)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded-md flex items-center gap-2"
                  style={{ color: t.textSub }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />{" "}
                  {tag.name}
                </button>
              ))}
              <div className="flex items-center gap-1 mt-1 px-1">
                <input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="New tag..."
                  className="flex-1 text-xs px-2 py-1 rounded-md outline-none"
                  style={{
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.text,
                  }}
                />
                <button
                  onClick={() => newTagInput && handleTagSelect(newTagInput)}
                  className="p-1 rounded-md"
                  style={{ backgroundColor: t.accent, color: "#fff" }}
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {convMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
      </div>

      <div
        className="border-t p-4"
        style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
      >
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => setReplyMode("reply")}
            className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              replyMode === "reply" ? "font-semibold" : ""
            }`}
            style={{
              backgroundColor: replyMode === "reply" ? t.accent : t.inputBg,
              color: replyMode === "reply" ? "#fff" : t.textSub,
            }}
          >
            <Reply className="w-3.5 h-3.5" /> Reply
          </button>
          <button
            onClick={() => setReplyMode("note")}
            className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              replyMode === "note" ? "font-semibold" : ""
            }`}
            style={{
              backgroundColor: replyMode === "note" ? "#F59E0B" : t.inputBg,
              color: replyMode === "note" ? "#fff" : t.textSub,
            }}
          >
            <Icon.Compose /> Note
          </button>
          <div className="flex-1" />
          <div className="relative">
            <button
              onClick={() => setShowSaved((v) => !v)}
              className="text-xs flex items-center gap-1 px-2 py-1.5 rounded-lg"
              style={{ color: t.textSub }}
            >
              Saved replies <ChevronDown className="w-3 h-3" />
            </button>
            {showSaved && (
              <div
                className="absolute right-0 bottom-full mb-2 w-64 rounded-xl z-40 max-h-60 overflow-auto"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                  boxShadow: t.shadow,
                }}
              >
                {savedReplies.map((sr) => (
                  <button
                    key={sr.id}
                    onClick={() => {
                      setReplyText(stripHtml(sr.body));
                      setShowSaved(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs border-b"
                    style={{ color: t.textSub, borderColor: t.divider }}
                  >
                    <span className="font-medium" style={{ color: t.text }}>
                      {sr.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="relative">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSend();
            }}
            placeholder={
              replyMode === "reply"
                ? "Write a reply..."
                : "Add an internal note..."
            }
            className="w-full min-h-[110px] p-3 rounded-xl text-sm outline-none resize-none"
            style={{
              backgroundColor: t.readMain,
              border: `1px solid ${t.inputBorder}`,
              color: t.text,
            }}
          />
          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {pendingAttachments.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                  style={{ backgroundColor: t.inputBg, color: t.textSub }}
                >
                  <Paperclip className="w-3 h-3" />
                  {a.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: t.textMuted }}
            >
              <label className="cursor-pointer">
                <Paperclip className="w-4 h-4" />
                <input type="file" className="hidden" onChange={handleAttach} />
              </label>
              <span>Ctrl + Enter to send</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSend()}
                disabled={!replyText.trim() && !pendingAttachments.length}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: t.accentGrad }}
              >
                Send {replyMode === "note" ? "Note" : "Reply"}
              </button>
              {replyMode === "reply" && (
                <button
                  onClick={() => handleSend(true)}
                  disabled={!replyText.trim() && !pendingAttachments.length}
                  className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{
                    color: t.textSub,
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                  }}
                >
                  Send & Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showForward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div
            className="w-full max-w-md rounded-2xl p-5"
            style={{ backgroundColor: t.readLeftBg, boxShadow: t.shadow }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: t.text }}>
                Forward conversation
              </h3>
              <button
                onClick={() => setShowForward(false)}
                style={{ color: t.textSub }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={fwdTo}
              onChange={(e) => setFwdTo(e.target.value)}
              placeholder="Forward to (email address)"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <textarea
              value={fwdNote}
              onChange={(e) => setFwdNote(e.target.value)}
              placeholder="Optional note..."
              className="w-full min-h-[80px] px-3 py-2 rounded-lg text-sm mb-4 outline-none resize-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForward(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: t.textSub }}
              >
                Cancel
              </button>
              <button
                onClick={handleForward}
                disabled={!fwdTo.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: t.accentGrad }}
              >
                Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {showSnooze && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div
            className="w-full max-w-sm rounded-2xl p-5"
            style={{ backgroundColor: t.readLeftBg, boxShadow: t.shadow }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm" style={{ color: t.text }}>
                Snooze until
              </h3>
              <button
                onClick={() => setShowSnooze(false)}
                style={{ color: t.textSub }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="date"
              value={snoozeDate}
              onChange={(e) => setSnoozeDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm mb-4 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSnooze(false)}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: t.textSub }}
              >
                Cancel
              </button>
              <button
                onClick={handleSnooze}
                disabled={!snoozeDate}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: t.accentGrad }}
              >
                Snooze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
