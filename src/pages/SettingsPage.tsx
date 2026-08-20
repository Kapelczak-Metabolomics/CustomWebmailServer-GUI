import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import ProfileSection from "../components/ProfileSection";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { api } from "../lib/api";
import {
  Bell,
  Palette,
  Tag,
  FileText,
  Building2,
  Plus,
  Save,
  Trash2,
  Edit3,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, tokens: t, setTheme, brand, refreshBrand } = useTheme();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const mailboxes = useStore((s) => s.mailboxes);

  const tags = useStore((s) => s.tags);
  const createTag = useStore((s) => s.createTag);
  const updateTag = useStore((s) => s.updateTag);
  const savedReplies = useStore((s) => s.savedReplies);
  const addSavedReply = useStore((s) => s.addSavedReply);
  const updateSavedReply = useStore((s) => s.updateSavedReply);
  const deleteSavedReply = useStore((s) => s.deleteSavedReply);

  const [form, setForm] = useState(settings);
  const [newTag, setNewTag] = useState("");
  const [newReply, setNewReply] = useState({ name: "", body: "" });
  const [showReply, setShowReply] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagForm, setEditTagForm] = useState({ name: "", color: "" });
  const [editingReply, setEditingReply] = useState<{
    id: string;
    name: string;
    subject: string;
    body: string;
  } | null>(null);
  const [brandForm, setBrandForm] = useState({
    companyName: brand?.companyName || "",
    primaryColor: brand?.primaryColor || "#2896E8",
  });

  useEffect(() => {
    if (brand) {
      setBrandForm({
        companyName: brand.companyName || "",
        primaryColor: brand.primaryColor || "#2896E8",
      });
    }
  }, [brand]);

  async function saveSettings() {
    await updateSettings(form);
  }

  async function saveBrand() {
    await api.updateBrand(brandForm);
    await refreshBrand();
  }

  async function addTag() {
    if (!newTag.trim()) return;
    await createTag(
      newTag.trim(),
      "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
    );
    setNewTag("");
  }

  async function addReply() {
    if (!newReply.name.trim() || !newReply.body.trim()) return;
    await addSavedReply({ name: newReply.name, body: newReply.body });
    setNewReply({ name: "", body: "" });
    setShowReply(false);
  }

  function startEditTag(id: string, name: string, color: string) {
    setEditingTagId(id);
    setEditTagForm({ name, color });
  }

  async function saveEditTag(id: string) {
    if (!editTagForm.name.trim()) return;
    await updateTag(id, {
      name: editTagForm.name.trim(),
      color: editTagForm.color,
    });
    setEditingTagId(null);
  }

  async function removeTag(id: string) {
    if (!window.confirm("Delete this tag?")) return;
    await api.deleteTag(id);
    useStore.setState((state) => ({
      tags: state.tags.filter((t) => t.id !== id),
    }));
  }

  async function saveEditReply() {
    if (!editingReply || !editingReply.name.trim()) return;
    await updateSavedReply({
      id: editingReply.id,
      name: editingReply.name.trim(),
      subject: editingReply.subject,
      body: editingReply.body,
    });
    setEditingReply(null);
  }

  async function removeSavedReply(id: string) {
    if (!window.confirm("Delete this saved reply?")) return;
    await deleteSavedReply(id);
  }

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-6">
        <h1 className="text-xl font-semibold mb-6" style={{ color: t.text }}>
          Settings
        </h1>

        <div className="space-y-6 mb-6">
          <ProfileSection />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section icon={Building2} title="Company">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company name"
                  value={form.companyName}
                  onChange={(v) => setForm({ ...form, companyName: v })}
                  t={t}
                />
                <Input
                  label="Office hours"
                  value={form.officeHours}
                  onChange={(v) => setForm({ ...form, officeHours: v })}
                  t={t}
                />
                <div className="sm:col-span-2">
                  <label
                    className="block text-xs font-medium mb-1.5"
                    style={{ color: t.textMuted }}
                  >
                    Default mailbox
                  </label>
                  <select
                    value={form.defaultMailboxId}
                    onChange={(e) =>
                      setForm({ ...form, defaultMailboxId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  >
                    {mailboxes.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Section>

            <Section icon={Bell} title="Notifications & Automation">
              <Toggle
                label="Auto-reply"
                checked={form.autoReply}
                onChange={(v) => setForm({ ...form, autoReply: v })}
                t={t}
              />
              <Toggle
                label="White-label"
                checked={form.whiteLabel}
                onChange={(v) => setForm({ ...form, whiteLabel: v })}
                t={t}
              />
              <Toggle
                label="Force read receipts for all users"
                checked={form.forceReadReceipts}
                onChange={(v) => setForm({ ...form, forceReadReceipts: v })}
                t={t}
              />
            </Section>

            <Section icon={Palette} title="Appearance">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    theme === "dark" ? "text-white" : ""
                  }`}
                  style={{
                    backgroundColor: theme === "dark" ? t.accent : t.inputBg,
                    color: theme === "dark" ? "#fff" : t.textSub,
                  }}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    theme === "light" ? "text-white" : ""
                  }`}
                  style={{
                    backgroundColor: theme === "light" ? t.accent : t.inputBg,
                    color: theme === "light" ? "#fff" : t.textSub,
                  }}
                >
                  Light
                </button>
              </div>
            </Section>

            <Section icon={Building2} title="Brand">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company name"
                  value={brandForm.companyName}
                  onChange={(v) =>
                    setBrandForm({ ...brandForm, companyName: v })
                  }
                  t={t}
                />
                <Input
                  label="Primary color"
                  value={brandForm.primaryColor}
                  onChange={(v) =>
                    setBrandForm({ ...brandForm, primaryColor: v })
                  }
                  t={t}
                />
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={saveBrand}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: t.accentGrad }}
                >
                  <Save className="w-4 h-4" /> Update brand
                </button>
              </div>
            </Section>

            <div className="flex justify-end">
              <button
                onClick={saveSettings}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                <Save className="w-4 h-4" /> Save changes
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <Section icon={Tag} title="Tags">
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) =>
                  editingTagId === tag.id ? (
                    <div
                      key={tag.id}
                      className="flex items-center gap-2 px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: t.inputBg,
                        border: `1px solid ${t.inputBorder}`,
                      }}
                    >
                      <input
                        type="color"
                        value={editTagForm.color}
                        onChange={(e) =>
                          setEditTagForm({
                            ...editTagForm,
                            color: e.target.value,
                          })
                        }
                        className="w-5 h-5 rounded-full border-0 bg-transparent cursor-pointer"
                      />
                      <input
                        value={editTagForm.name}
                        onChange={(e) =>
                          setEditTagForm({
                            ...editTagForm,
                            name: e.target.value,
                          })
                        }
                        className="text-xs px-1 py-0.5 rounded outline-none w-24"
                        style={{
                          backgroundColor: t.inputBg,
                          color: t.text,
                        }}
                      />
                      <button
                        onClick={() => saveEditTag(tag.id)}
                        className="text-xs font-semibold"
                        style={{ color: t.accent }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTagId(null)}
                        className="text-xs"
                        style={{ color: t.textSub }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-1 rounded-full flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${tag.color}22`,
                        color: tag.color,
                        border: `1px solid ${tag.color}40`,
                      }}
                    >
                      {tag.name}
                      <button
                        onClick={() =>
                          startEditTag(tag.id, tag.name, tag.color)
                        }
                        className="opacity-60 hover:opacity-100"
                        title="Edit tag"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeTag(tag.id)}
                        className="opacity-60 hover:opacity-100"
                        title="Delete tag"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ),
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="New tag"
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.text,
                  }}
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 rounded-lg text-white"
                  style={{ background: t.accentGrad }}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </Section>

            <Section icon={FileText} title="Saved replies">
              <div className="space-y-2 mb-3">
                {savedReplies.map((sr) => (
                  <div
                    key={sr.id}
                    className="p-2 rounded-lg text-sm"
                    style={{ backgroundColor: t.readLeftBg }}
                  >
                    <div
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="font-medium truncate" style={{ color: t.text }}>
                        {sr.name}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() =>
                            setEditingReply({
                              id: sr.id,
                              name: sr.name,
                              subject: sr.subject,
                              body: sr.body,
                            })
                          }
                          className="opacity-60 hover:opacity-100"
                          title="Edit reply"
                          style={{ color: t.textSub }}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => removeSavedReply(sr.id)}
                          className="opacity-60 hover:opacity-100"
                          title="Delete reply"
                          style={{ color: t.textSub }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div
                      className="text-xs truncate"
                      style={{ color: t.textMuted }}
                    >
                      {sr.body.replace(/<[^>]+>/g, "")}
                    </div>
                  </div>
                ))}
              </div>
              {showReply ? (
                <div className="space-y-2">
                  <input
                    value={newReply.name}
                    onChange={(e) =>
                      setNewReply({ ...newReply, name: e.target.value })
                    }
                    placeholder="Name"
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                  <textarea
                    value={newReply.body}
                    onChange={(e) =>
                      setNewReply({ ...newReply, body: e.target.value })
                    }
                    placeholder="Reply body"
                    className="w-full min-h-[80px] px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{
                      backgroundColor: t.inputBg,
                      border: `1px solid ${t.inputBorder}`,
                      color: t.text,
                    }}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowReply(false)}
                      className="text-xs"
                      style={{ color: t.textSub }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addReply}
                      className="text-xs px-3 py-1.5 rounded-lg text-white"
                      style={{ background: t.accentGrad }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowReply(true)}
                  className="text-sm flex items-center gap-1"
                  style={{ color: t.accent }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add reply
                </button>
              )}
            </Section>
          </div>
        </div>

        {editingReply && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            onClick={() => setEditingReply(null)}
          >
            <div
              className="w-full max-w-md rounded-xl p-5 space-y-3"
              style={{
                backgroundColor: t.card,
                border: `1px solid ${t.cardBorder}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex items-center justify-between"
              >
                <h3
                  className="text-sm font-semibold"
                  style={{ color: t.text }}
                >
                  Edit saved reply
                </h3>
                <button
                  onClick={() => setEditingReply(null)}
                  style={{ color: t.textSub }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                value={editingReply.name}
                onChange={(e) =>
                  setEditingReply({ ...editingReply, name: e.target.value })
                }
                placeholder="Name"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <input
                value={editingReply.subject}
                onChange={(e) =>
                  setEditingReply({ ...editingReply, subject: e.target.value })
                }
                placeholder="Subject"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <textarea
                value={editingReply.body}
                onChange={(e) =>
                  setEditingReply({ ...editingReply, body: e.target.value })
                }
                placeholder="Reply body"
                className="w-full min-h-[120px] px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingReply(null)}
                  className="text-xs"
                  style={{ color: t.textSub }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditReply}
                  className="text-xs px-3 py-1.5 rounded-lg text-white"
                  style={{ background: t.accentGrad }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  const t = useTheme().tokens;
  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: t.card, border: `1px solid ${t.cardBorder}` }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4" style={{ color: t.accent }} />
        <h3 className="text-sm font-semibold" style={{ color: t.text }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  t: any;
}) {
  return (
    <div>
      <label
        className="block text-xs font-medium mb-1.5"
        style={{ color: t.textMuted }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{
          backgroundColor: t.inputBg,
          border: `1px solid ${t.inputBorder}`,
          color: t.text,
        }}
      />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  t,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  t: any;
}) {
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm" style={{ color: t.textSub }}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-10 h-5 rounded-full relative transition-colors"
        style={{ backgroundColor: checked ? t.accent : t.inputBorder }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </button>
    </label>
  );
}
