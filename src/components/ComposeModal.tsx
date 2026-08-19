import { useState, useMemo } from "react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { api } from "../lib/api";
import { Icon } from "./Icon";
import { X, Paperclip } from "lucide-react";

function toHtml(text: string) {
  return text
    .split(/\n+/)
    .filter(Boolean)
    .map((p) => `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
    .join("");
}

export default function ComposeModal() {
  const { tokens: t } = useTheme();
  const open = useStore((s) => s.ui.composeOpen);
  const setComposeOpen = useStore((s) => s.setComposeOpen);
  const mailboxes = useStore((s) => s.mailboxes);
  const contacts = useStore((s) => s.contacts);
  const currentUser = useStore((s) => s.currentUser);
  const createConversation = useStore((s) => s.createConversation);
  const addContact = useStore((s) => s.addContact);
  const selectConversation = useStore((s) => s.selectConversation);

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [mailboxId, setMailboxId] = useState(mailboxes[0]?.id || "");
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<
    {
      name: string;
      url: string;
    }[]
  >([]);

  const filteredContacts = useMemo(() => {
    const term = to.trim().toLowerCase();
    if (!term) return [];
    return contacts
      .filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term),
      )
      .slice(0, 5);
  }, [contacts, to]);

  function close() {
    setComposeOpen(false);
    setTo("");
    setSubject("");
    setBody("");
    setErrors([]);
    setPendingAttachments([]);
  }

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

  async function submit() {
    const e = [];
    if (!to.includes("@")) e.push("Enter a valid email");
    if (!subject.trim()) e.push("Subject is required");
    if (!body.trim() && !pendingAttachments.length)
      e.push("Message body is required");
    if (e.length) {
      setErrors(e);
      return;
    }

    let contact = contacts.find(
      (c) => c.email.toLowerCase() === to.trim().toLowerCase(),
    );
    if (!contact) {
      const name = to
        .split("@")[0]
        .replace(/\.|_/g, " ")
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
      contact = await addContact({ name, email: to.trim() });
    }
    const conv = await createConversation({
      subject: subject.trim(),
      mailboxId,
      customerId: contact.id,
      body: toHtml(body.trim()) + attachmentHtml(),
    });
    selectConversation(conv.id);
    close();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6">
      <div
        className="w-full sm:w-[640px] max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{ backgroundColor: t.readLeftBg, boxShadow: t.shadow }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
        >
          <h3 className="font-semibold text-sm" style={{ color: t.text }}>
            New Conversation
          </h3>
          <button
            onClick={close}
            className="p-1 rounded-lg"
            style={{ color: t.textSub }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          {errors.length > 0 && (
            <div
              className="text-xs p-2 rounded-lg"
              style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
            >
              {errors.join(" • ")}
            </div>
          )}

          <div className="relative">
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: t.textMuted }}
            >
              To
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            {filteredContacts.length > 0 && (
              <div
                className="absolute z-10 left-0 right-0 mt-1 rounded-lg overflow-hidden"
                style={{
                  backgroundColor: t.card,
                  border: `1px solid ${t.cardBorder}`,
                  boxShadow: t.shadow,
                }}
              >
                {filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setTo(c.email)}
                    className="w-full text-left px-3 py-2 text-xs"
                    style={{ color: t.textSub }}
                  >
                    <span className="font-medium" style={{ color: t.text }}>
                      {c.name}
                    </span>{" "}
                    <span style={{ color: t.textMuted }}>
                      &lt;{c.email}&gt;
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: t.textMuted }}
            >
              Mailbox
            </label>
            <select
              value={mailboxId}
              onChange={(e) => setMailboxId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            >
              {mailboxes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} &lt;{m.email}&gt;
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: t.textMuted }}
            >
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="What is this about?"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
          </div>

          <div>
            <label
              className="text-xs font-medium mb-1 block"
              style={{ color: t.textMuted }}
            >
              Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message..."
              className="w-full min-h-[160px] px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
          </div>
        </div>

        {pendingAttachments.length > 0 && (
          <div className="px-4 py-2 flex flex-wrap gap-2">
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
        <div
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
        >
          <label
            className="p-2 rounded-lg cursor-pointer"
            style={{ color: t.textSub }}
          >
            <Paperclip className="w-4 h-4" />
            <input type="file" className="hidden" onChange={handleAttach} />
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={close}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: t.textSub }}
            >
              Discard
            </button>
            <button
              onClick={submit}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: t.accentGrad }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
