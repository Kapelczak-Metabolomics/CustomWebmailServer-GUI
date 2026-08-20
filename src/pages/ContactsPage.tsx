import { useState } from "react";
import Layout from "../components/Layout";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { formatDate, getInitials } from "../lib/utils";
import {
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  Calendar,
  StickyNote,
  Trash2,
  Edit3,
} from "lucide-react";

export default function ContactsPage() {
  const { tokens: t } = useTheme();
  const contacts = useStore((s) => s.contacts);
  const conversations = useStore((s) => s.conversations);
  const currentUser = useStore((s) => s.currentUser);
  const addContact = useStore((s) => s.addContact);
  const updateContact = useStore((s) => s.updateContact);
  const deleteContact = useStore((s) => s.deleteContact);
  const deleteContactNote = useStore((s) => s.deleteContactNote);
  const updateContactNote = useStore((s) => s.updateContactNote);
  const addNote = useStore((s) => s.addNote);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEdit, setNoteEdit] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(search.toLowerCase())),
  );
  const selectedContact = contacts.find((c) => c.id === selected);
  const selectedTickets = conversations.filter(
    (c) => c.customerId === selected,
  );

  async function handleAdd() {
    if (!form.name || !form.email) return;
    const c = await addContact({
      name: form.name,
      email: form.email,
      company: form.company,
      phone: form.phone,
    });
    setForm({ name: "", email: "", company: "", phone: "" });
    setShowAdd(false);
    setSelected(c.id);
  }

  async function handleAddNote() {
    if (!selected || !note.trim() || !currentUser) return;
    await addNote(selected, note, currentUser.id);
    setNote("");
  }

  async function handleDeleteContact() {
    if (!selected) return;
    if (!window.confirm("Delete this contact? This cannot be undone.")) return;
    await deleteContact(selected);
    setSelected(null);
    setEditingContact(false);
  }

  function openEditContact() {
    if (!selectedContact) return;
    setForm({
      name: selectedContact.name,
      email: selectedContact.email,
      company: selectedContact.company || "",
      phone: selectedContact.phone || "",
    });
    setEditingContact(true);
    setShowAdd(true);
  }

  async function handleSaveContact() {
    if (!form.name || !form.email) return;
    if (editingContact && selected) {
      await updateContact({
        id: selected,
        name: form.name,
        email: form.email,
        company: form.company,
        phone: form.phone,
      });
      setEditingContact(false);
      setShowAdd(false);
    } else {
      await handleAdd();
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!selected) return;
    if (!window.confirm("Delete this note?")) return;
    await deleteContactNote(selected, noteId);
  }

  function startEditNote(noteId: string, body: string) {
    setEditingNoteId(noteId);
    setNoteEdit(body);
  }

  async function saveEditNote(noteId: string) {
    if (!selected || !noteEdit.trim()) return;
    await updateContactNote(selected, noteId, noteEdit.trim());
    setEditingNoteId(null);
    setNoteEdit("");
  }

  return (
    <Layout>
      <div className="h-full flex flex-col md:flex-row overflow-hidden">
        <div
          className="w-full md:w-[360px] flex-shrink-0 flex flex-col h-full border-r"
          style={{ borderColor: t.divider, backgroundColor: t.readLeftBg }}
        >
          <div className="p-4 border-b" style={{ borderColor: t.divider }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: t.text }}>
                Contacts
              </h2>
              <button
                onClick={() => {
                  setEditingContact(false);
                  setForm({ name: "", email: "", company: "", phone: "" });
                  setShowAdd(true);
                }}
                className="p-2 rounded-lg"
                style={{ backgroundColor: t.accent, color: "#fff" }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search
                className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: t.textFaint }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className="w-full text-left px-4 py-3 border-b flex items-center gap-3 transition-colors"
                style={{
                  backgroundColor:
                    selected === c.id ? t.rowSelected : "transparent",
                  borderColor: t.divider,
                }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                    color: t.accent,
                  }}
                >
                  {getInitials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: t.text }}
                  >
                    {c.name}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{ color: t.textMuted }}
                  >
                    {c.email}
                  </div>
                </div>
                <div className="text-xs" style={{ color: t.textFaint }}>
                  {conversations.filter((x) => x.customerId === c.id).length}{" "}
                  tickets
                </div>
              </button>
            ))}
          </div>
        </div>

        <div
          className="flex-1 min-w-0 h-full overflow-y-auto p-6"
          style={{ backgroundColor: t.readMain }}
        >
          {selectedContact ? (
            <>
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold"
                  style={{
                    background: `linear-gradient(135deg,${t.accent}22,${t.accent}10)`,
                    color: t.accent,
                  }}
                >
                  {getInitials(selectedContact.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2
                      className="text-xl font-semibold"
                      style={{ color: t.text }}
                    >
                      {selectedContact.name}
                    </h2>
                    <button
                      onClick={openEditContact}
                      className="p-1.5 rounded-lg"
                      style={{ color: t.textSub }}
                      title="Edit contact"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleDeleteContact}
                      className="p-1.5 rounded-lg"
                      style={{ color: t.textSub }}
                      title="Delete contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div
                    className="flex flex-wrap items-center gap-4 mt-1 text-sm"
                    style={{ color: t.textMuted }}
                  >
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {selectedContact.email}
                    </span>
                    {selectedContact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />{" "}
                        {selectedContact.phone}
                      </span>
                    )}
                    {selectedContact.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />{" "}
                        {selectedContact.company}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />{" "}
                      {formatDate(selectedContact.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  className="rounded-xl p-5"
                  style={{
                    backgroundColor: t.card,
                    border: `1px solid ${t.cardBorder}`,
                  }}
                >
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: t.text }}
                  >
                    Tickets ({selectedTickets.length})
                  </h3>
                  {selectedTickets.length === 0 ? (
                    <p className="text-sm" style={{ color: t.textMuted }}>
                      No tickets yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedTickets.map((tk) => (
                        <div
                          key={tk.id}
                          className="p-3 rounded-lg text-sm"
                          style={{ backgroundColor: t.readLeftBg }}
                        >
                          <div
                            className="font-medium"
                            style={{ color: t.text }}
                          >
                            {tk.subject}
                          </div>
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: t.textMuted }}
                          >
                            {tk.status} • {tk.priority}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{
                    backgroundColor: t.card,
                    border: `1px solid ${t.cardBorder}`,
                  }}
                >
                  <h3
                    className="text-sm font-semibold mb-3"
                    style={{ color: t.text }}
                  >
                    Notes
                  </h3>
                  <div className="space-y-2 mb-3">
                    {selectedContact.notes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-lg text-sm"
                        style={{ backgroundColor: t.readLeftBg }}
                      >
                        <div
                          className="flex items-center justify-between mb-1"
                          style={{ color: t.textMuted }}
                        >
                          <span className="text-xs">
                            {formatDate(n.createdAt)}
                          </span>
                          <div className="flex items-center gap-1">
                            {editingNoteId === n.id ? null : (
                              <>
                                <button
                                  onClick={() => startEditNote(n.id, n.body)}
                                  className="p-1 rounded"
                                  style={{ color: t.textSub }}
                                  title="Edit note"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteNote(n.id)}
                                  className="p-1 rounded"
                                  style={{ color: t.textSub }}
                                  title="Delete note"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {editingNoteId === n.id ? (
                          <div className="flex gap-2">
                            <input
                              value={noteEdit}
                              onChange={(e) => setNoteEdit(e.target.value)}
                              autoFocus
                              className="flex-1 px-2 py-1 rounded-lg text-sm outline-none"
                              style={{
                                backgroundColor: t.inputBg,
                                border: `1px solid ${t.inputBorder}`,
                                color: t.text,
                              }}
                            />
                            <button
                              onClick={() => saveEditNote(n.id)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold text-white"
                              style={{ background: t.accentGrad }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingNoteId(null);
                                setNoteEdit("");
                              }}
                              className="px-2 py-1 rounded-lg text-xs"
                              style={{ color: t.textSub }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ color: t.textSub }}>{n.body}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddNote();
                      }}
                      placeholder="Add a note..."
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                      style={{
                        backgroundColor: t.inputBg,
                        border: `1px solid ${t.inputBorder}`,
                        color: t.text,
                      }}
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
                      style={{ background: t.accentGrad }}
                    >
                      <StickyNote className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="h-full flex flex-col items-center justify-center text-center"
              style={{ color: t.textMuted }}
            >
              <UsersPlaceholder className="w-12 h-12 mb-4" />
              <p className="text-sm">
                Select a contact to view details and notes.
              </p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div
            className="w-full max-w-md rounded-2xl p-6"
            style={{ backgroundColor: t.readLeftBg, boxShadow: t.shadow }}
          >
            <h3 className="font-semibold mb-4" style={{ color: t.text }}>
              {editingContact ? "Edit contact" : "Add contact"}
            </h3>
            <div className="space-y-3 mb-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Name"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Company"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAdd(false);
                  setEditingContact(false);
                }}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ color: t.textSub }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveContact}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                {editingContact ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function UsersPlaceholder({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
