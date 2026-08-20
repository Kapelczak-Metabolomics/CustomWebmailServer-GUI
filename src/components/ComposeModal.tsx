import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { api } from "../lib/api";
import { toast } from "./ui/toastStore";
import { Icon } from "./Icon";
import RichTextEditor from "./RichTextEditor";
import {
  X,
  Paperclip,
  Send,
  Trash2,
  ChevronDown,
  Save,
  FileText,
  Minus,
  Expand,
  StickyNote,
} from "lucide-react";

const DRAFT_KEY = "compose-draft";

interface DraftData {
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  mailboxId: string;
  internalNote: string;
  attachments: { name: string; url: string }[];
  savedAt: string;
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

function saveDraft(data: DraftData) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
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
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [mailboxId, setMailboxId] = useState(mailboxes[0]?.id || "");
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingAttachments, setPendingAttachments] = useState<
    { name: string; url: string }[]
  >([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [showInternalNote, setShowInternalNote] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load draft on open
  useEffect(() => {
    if (open) {
      const draft = loadDraft();
      if (draft) {
        setTo(draft.to);
        setCc(draft.cc);
        setBcc(draft.bcc);
        setSubject(draft.subject);
        setBody(draft.body);
        setInternalNote(draft.internalNote || "");
        if (draft.internalNote) setShowInternalNote(true);
        setMailboxId(draft.mailboxId || mailboxes[0]?.id || "");
        setPendingAttachments(draft.attachments || []);
        setHasDraft(true);
      }
    }
  }, [open]);

  // Autosave draft
  const doAutosave = useCallback(() => {
    if (!to && !subject && !body && !cc && !bcc && !internalNote && pendingAttachments.length === 0) {
      return;
    }
    const data: DraftData = {
      to,
      cc,
      bcc,
      subject,
      body,
      internalNote,
      mailboxId,
      attachments: pendingAttachments,
      savedAt: new Date().toISOString(),
    };
    saveDraft(data);
    setDraftSavedAt(new Date().toLocaleTimeString());
  }, [to, cc, bcc, subject, body, internalNote, mailboxId, pendingAttachments]);

  useEffect(() => {
    if (!open) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      doAutosave();
    }, 2000);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [to, cc, bcc, subject, body, internalNote, mailboxId, pendingAttachments, open, doAutosave]);

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
    setIsMinimized(false);
    setIsMaximized(false);
    setShowCcBcc(false);
    setErrors([]);
  }

  function discard() {
    clearDraft();
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setInternalNote("");
    setShowInternalNote(false);
    setErrors([]);
    setPendingAttachments([]);
    setHasDraft(false);
    setDraftSavedAt(null);
    setComposeOpen(false);
    setIsMinimized(false);
    setIsMaximized(false);
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
      toast("Attachment added", "success");
    } catch (err) {
      console.error("Upload failed", err);
      toast("Failed to upload attachment", "error");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachment(idx: number) {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    const e = [];
    if (!to.includes("@")) e.push("Enter a valid recipient email");
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
      body: body.trim() + attachmentHtml(),
      internalNote: internalNote.trim() || undefined,
    });
    selectConversation(conv.id);
    clearDraft();
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setInternalNote("");
    setShowInternalNote(false);
    setErrors([]);
    setPendingAttachments([]);
    setHasDraft(false);
    setDraftSavedAt(null);
    setComposeOpen(false);
    toast(internalNote.trim() ? "Message sent with internal note" : "Message sent", "success");
  }

  if (!open) return null;

  // Minimized view
  if (isMinimized) {
    return (
      <div
        className="fixed bottom-0 right-6 z-50 rounded-t-xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: t.readLeftBg, border: `1px solid ${t.divider}`, width: 320 }}
      >
        <div
          className="flex items-center justify-between px-4 py-2.5 cursor-pointer"
          style={{ backgroundColor: t.readTopBg, borderBottom: `1px solid ${t.divider}` }}
          onClick={() => setIsMinimized(false)}
        >
          <span className="text-sm font-medium truncate" style={{ color: t.text }}>
            {subject || "New Message"}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
              className="p-1 rounded"
              style={{ color: t.textSub }}
            >
              <Expand className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); close(); }}
              className="p-1 rounded"
              style={{ color: t.textSub }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const containerClass = isMaximized
    ? "fixed inset-2 z-50 rounded-2xl flex flex-col overflow-hidden"
    : "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-6";

  const panelStyle = isMaximized
    ? {
        backgroundColor: t.readLeftBg,
        boxShadow: t.shadow,
        height: "100%",
      }
    : {
        backgroundColor: t.readLeftBg,
        boxShadow: t.shadow,
      };

  const panelClass = isMaximized
    ? "w-full h-full flex flex-col overflow-hidden"
    : "w-full sm:w-[720px] max-h-[92vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden";

  return (
    <div className={containerClass}>
      <div className={panelClass} style={panelStyle}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: t.accentGrad }}
            >
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm" style={{ color: t.text }}>
                New Message
              </h3>
              {draftSavedAt && (
                <span className="text-[10px]" style={{ color: t.textMuted }}>
                  Draft saved at {draftSavedAt}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasDraft && (
              <button
                onClick={() => {
                  if (window.confirm("Discard current draft and start fresh?")) {
                    clearDraft();
                    setTo(""); setCc(""); setBcc(""); setSubject(""); setBody("");
                    setInternalNote(""); setShowInternalNote(false);
                    setPendingAttachments([]); setHasDraft(false); setDraftSavedAt(null);
                  }
                }}
                className="p-1.5 rounded-lg text-xs"
                style={{ color: t.textMuted }}
                title="Discard draft"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-lg"
              style={{ color: t.textSub }}
              title="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1.5 rounded-lg"
              style={{ color: t.textSub }}
              title={isMaximized ? "Restore" : "Maximize"}
            >
              <Expand className="w-4 h-4" />
            </button>
            <button
              onClick={close}
              className="p-1.5 rounded-lg"
              style={{ color: t.textSub }}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 overflow-y-auto">
          {errors.length > 0 && (
            <div
              className="mx-4 mt-3 text-xs p-2.5 rounded-lg"
              style={{ backgroundColor: "#EF444422", color: "#EF4444" }}
            >
              {errors.join(" • ")}
            </div>
          )}

          {/* Recipient fields */}
          <div className="px-4 pt-3 space-y-0">
            {/* From / Mailbox selector */}
            <div className="flex items-center gap-2 py-2 border-b" style={{ borderColor: t.divider }}>
              <span className="text-xs font-medium w-14 flex-shrink-0" style={{ color: t.textMuted }}>
                From
              </span>
              <select
                value={mailboxId}
                onChange={(e) => setMailboxId(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: t.text }}
              >
                {mailboxes.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} &lt;{m.email}&gt;
                  </option>
                ))}
              </select>
            </div>

            {/* To */}
            <div className="flex items-center gap-2 py-2 border-b relative" style={{ borderColor: t.divider }}>
              <span className="text-xs font-medium w-14 flex-shrink-0" style={{ color: t.textMuted }}>
                To
              </span>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com"
                className="flex-1 text-sm outline-none bg-transparent"
                style={{ color: t.text }}
              />
              {!showCcBcc && (
                <button
                  onClick={() => setShowCcBcc(true)}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{ color: t.accent }}
                >
                  Cc Bcc
                </button>
              )}
              {filteredContacts.length > 0 && (
                <div
                  className="absolute z-20 left-14 right-4 top-full mt-1 rounded-lg overflow-hidden"
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
                      className="w-full text-left px-3 py-2 text-xs hover:opacity-80"
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

            {/* CC */}
            {showCcBcc && (
              <div className="flex items-center gap-2 py-2 border-b" style={{ borderColor: t.divider }}>
                <span className="text-xs font-medium w-14 flex-shrink-0" style={{ color: t.textMuted }}>
                  Cc
                </span>
                <input
                  type="text"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  className="flex-1 text-sm outline-none bg-transparent"
                  style={{ color: t.text }}
                />
              </div>
            )}

            {/* BCC */}
            {showCcBcc && (
              <div className="flex items-center gap-2 py-2 border-b" style={{ borderColor: t.divider }}>
                <span className="text-xs font-medium w-14 flex-shrink-0" style={{ color: t.textMuted }}>
                  Bcc
                </span>
                <input
                  type="text"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  className="flex-1 text-sm outline-none bg-transparent"
                  style={{ color: t.text }}
                />
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2 py-2 border-b" style={{ borderColor: t.divider }}>
              <span className="text-xs font-medium w-14 flex-shrink-0" style={{ color: t.textMuted }}>
                Subject
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="What is this about?"
                className="flex-1 text-sm outline-none bg-transparent font-medium"
                style={{ color: t.text }}
              />
            </div>
          </div>

          {/* Rich text editor */}
          <div className="p-4">
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your message..."
              minHeight={isMaximized ? 300 : 200}
            />

            {/* Internal note toggle */}
            {!showInternalNote ? (
              <button
                onClick={() => setShowInternalNote(true)}
                className="mt-3 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{
                  color: "#F59E0B",
                  backgroundColor: "#F59E0B15",
                }}
              >
                <StickyNote className="w-3.5 h-3.5" />
                Add internal note
              </button>
            ) : (
              <div
                className="mt-3 rounded-xl overflow-hidden"
                style={{ border: `1px solid #F59E0B40` }}
              >
                <div
                  className="flex items-center justify-between px-3 py-2 border-b"
                  style={{ backgroundColor: "#F59E0B12", borderColor: "#F59E0B40" }}
                >
                  <div className="flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                    <span className="text-xs font-semibold" style={{ color: "#F59E0B" }}>
                      Internal note (visible to team only)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setInternalNote("");
                      setShowInternalNote(false);
                    }}
                    className="p-0.5 rounded"
                    style={{ color: t.textMuted }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <RichTextEditor
                  value={internalNote}
                  onChange={setInternalNote}
                  placeholder="Add a note for your team — the customer won't see this..."
                  minHeight={80}
                />
              </div>
            )}
          </div>

          {/* Attachments */}
          {pendingAttachments.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {pendingAttachments.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
                  style={{ backgroundColor: t.inputBg, color: t.textSub, border: `1px solid ${t.divider}` }}
                >
                  <Paperclip className="w-3 h-3" />
                  {a.name}
                  <button
                    onClick={() => removeAttachment(i)}
                    className="ml-1 p-0.5 rounded"
                    style={{ color: t.textMuted }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer / action bar */}
        <div
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: t.divider, backgroundColor: t.readTopBg }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleAttach}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ color: t.textSub, backgroundColor: t.inputBg }}
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
              Attach
            </button>
            <button
              onClick={doAutosave}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ color: t.textSub, backgroundColor: t.inputBg }}
              title="Save draft"
            >
              <Save className="w-4 h-4" />
              Save draft
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={discard}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ color: t.textSub }}
            >
              Discard
            </button>
            <button
              onClick={submit}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: t.accentGrad }}
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
