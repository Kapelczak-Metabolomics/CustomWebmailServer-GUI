import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { api } from "../lib/api";
import {
  Users,
  Mail,
  Workflow,
  Plus,
  X,
  Check,
  Package,
  Palette,
  Save,
} from "lucide-react";

const MODULES = [
  "API & Webhooks",
  "Auto Login",
  "Block External Images",
  "Chat",
  "Checklists",
  "CRM",
  "Custom Fields",
  "Custom Folders",
  "Custom Homepage",
  "Custom Signatures",
  "Customer Data Enrichment",
  "Customization",
  "Dark Mode",
  "Easy Digital Downloads",
  "Email Commands",
  "Embed Images",
  "End-User Portal",
  "Export Conversations",
  "Extended Attachments",
  "Extended Editor",
  "Extra Security",
  "Facebook",
  "Faster Search",
  "Followers",
  "GDPR",
  "Global Mailbox",
  "IMAP Move",
  "Inbox",
  "Jira",
  "Kanban",
  "Keyboard Shortcuts",
  "Knowledge Base",
  "LDAP",
  "Mail Signing",
  "Mailbox Icons",
  "Mentions",
  "Mobile Notifications",
  "No-Reply",
  "OAuth Login",
  "Office Hours",
  "Out of Office",
  "Reports",
  "Rocket.Chat",
  "SAML",
  "Satisfaction Ratings",
  "Saved Replies",
  "Send & Close",
  "Send Later",
  "Sender Time Zone",
  "Sent Folder",
  "Slack",
  "SMS Notifications",
  "SMS Tickets",
  "Snooze",
  "Spam Filter",
  "Sticky Notes",
  "Tags",
  "Teams",
  "Telegram Integration",
  "Telegram",
  "Ticket Number",
  "Ticket Translator",
  "Time Tracking",
  "Twitter",
  "Two-Factor Auth",
  "User Fields",
  "Wallboards",
  "WhatsApp",
  "White Label",
  "WooCommerce",
  "Workflows",
];

export default function AdminPage() {
  const { tokens: t, brand, logoUrl, faviconUrl, refreshBrand } = useTheme();
  const users = useStore((s) => s.users);
  const mailboxes = useStore((s) => s.mailboxes);
  const workflows = useStore((s) => s.workflows);
  const addUser = useStore((s) => s.addUser);
  const addMailbox = useStore((s) => s.addMailbox);
  const updateMailbox = useStore((s) => s.updateMailbox);
  const addWorkflow = useStore((s) => s.addWorkflow);

  const [activeTab, setActiveTab] = useState<
    "users" | "mailboxes" | "workflows" | "modules" | "brand"
  >("users");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddMailbox, setShowAddMailbox] = useState(false);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [editingMailboxId, setEditingMailboxId] = useState<string | null>(null);
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>(
    {},
  );

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "agent" as any,
    password: "",
  });
  const [mbForm, setMbForm] = useState({
    name: "",
    email: "",
    color: "#2896E8",
    imapHost: "",
    imapPort: 993,
    imapSecure: true,
    imapUser: "",
    imapPassword: "",
    smtpHost: "",
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: "",
    smtpPassword: "",
  });
  const [wfForm, setWfForm] = useState({
    name: "",
    conditions: "",
    actions: "",
  });
  const [brandForm, setBrandForm] = useState({
    companyName: "",
    primaryColor: "#2896E8",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [brandLoading, setBrandLoading] = useState(false);

  async function submitUser() {
    if (!userForm.name || !userForm.email || !userForm.password) return;
    await addUser({
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      password: userForm.password,
    });
    setUserForm({ name: "", email: "", role: "agent", password: "" });
    setShowAddUser(false);
  }

  async function submitMailbox() {
    if (!mbForm.name || !mbForm.email) return;
    if (editingMailboxId) {
      await updateMailbox(editingMailboxId, mbForm);
    } else {
      await addMailbox(mbForm as any);
    }
    setMbForm({
      name: "",
      email: "",
      color: "#2896E8",
      imapHost: "",
      imapPort: 993,
      imapSecure: true,
      imapUser: "",
      imapPassword: "",
      smtpHost: "",
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: "",
      smtpPassword: "",
    });
    setEditingMailboxId(null);
    setShowAddMailbox(false);
  }

  function editMailbox(m: any) {
    setEditingMailboxId(m.id);
    setMbForm({
      name: m.name || "",
      email: m.email || "",
      color: m.color || "#2896E8",
      imapHost: m.imapHost || "",
      imapPort: m.imapPort || 993,
      imapSecure: m.imapSecure ?? true,
      imapUser: m.imapUser || "",
      imapPassword: m.imapPassword || "",
      smtpHost: m.smtpHost || "",
      smtpPort: m.smtpPort || 587,
      smtpSecure: m.smtpSecure ?? false,
      smtpUser: m.smtpUser || "",
      smtpPassword: m.smtpPassword || "",
    });
    setShowAddMailbox(true);
  }

  async function submitWorkflow() {
    if (!wfForm.name || !wfForm.conditions || !wfForm.actions) return;
    await addWorkflow({
      name: wfForm.name,
      conditions: wfForm.conditions,
      actions: wfForm.actions,
    });
    setWfForm({ name: "", conditions: "", actions: "" });
    setShowAddWorkflow(false);
  }

  useEffect(() => {
    if (brand) {
      setBrandForm({
        companyName: brand.companyName || "",
        primaryColor: brand.primaryColor || "#2896E8",
      });
      const saved = brand.modules || {};
      setEnabledModules({
        ...Object.fromEntries(MODULES.map((m) => [m, false])),
        ...saved,
      });
    }
  }, [brand]);

  function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function submitBrand() {
    setBrandLoading(true);
    const data: any = { ...brandForm };
    try {
      if (logoFile) data.logoS3Key = await readFile(logoFile);
      if (faviconFile) data.faviconS3Key = await readFile(faviconFile);
      await api.updateBrand(data);
      await refreshBrand();
      setLogoFile(null);
      setFaviconFile(null);
    } finally {
      setBrandLoading(false);
    }
  }

  const TabButton = ({
    id,
    label,
    icon: Icon,
  }: {
    id: typeof activeTab;
    label: string;
    icon: any;
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      style={{
        backgroundColor: activeTab === id ? t.accent : t.inputBg,
        color: activeTab === id ? "#fff" : t.textSub,
      }}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <Layout>
      <div className="h-full overflow-y-auto p-6">
        <h1 className="text-xl font-semibold mb-6" style={{ color: t.text }}>
          Admin
        </h1>

        <div className="flex flex-wrap gap-2 mb-6">
          <TabButton id="users" label="Users" icon={Users} />
          <TabButton id="mailboxes" label="Mailboxes" icon={Mail} />
          <TabButton id="workflows" label="Workflows" icon={Workflow} />
          <TabButton id="modules" label="Modules" icon={Package} />
          <TabButton id="brand" label="Brand" icon={Palette} />
        </div>

        {activeTab === "users" && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                Team members
              </h3>
              <button
                onClick={() => setShowAddUser(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                <Plus className="w-3.5 h-3.5" /> Add user
              </button>
            </div>
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: t.readLeftBg }}
                >
                  <div>
                    <div
                      className="text-sm font-medium"
                      style={{ color: t.text }}
                    >
                      {u.name}
                    </div>
                    <div className="text-xs" style={{ color: t.textMuted }}>
                      {u.email} • {u.role}
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-2 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        u.status === "active" ? `${t.accent}22` : t.badgeBg,
                      color: u.status === "active" ? t.accent : t.textMuted,
                    }}
                  >
                    {u.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "mailboxes" && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                Mailboxes
              </h3>
              <button
                onClick={() => setShowAddMailbox(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                <Plus className="w-3.5 h-3.5" /> Add mailbox
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mailboxes.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: t.readLeftBg,
                    border: `1px solid ${t.divider}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      <span
                        className="font-medium text-sm"
                        style={{ color: t.text }}
                      >
                        {m.name}
                      </span>
                    </div>
                    <button
                      onClick={() => editMailbox(m)}
                      className="text-xs px-2 py-1 rounded-lg"
                      style={{
                        color: t.accent,
                        backgroundColor: `${t.accent}15`,
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <div className="text-xs" style={{ color: t.textMuted }}>
                    {m.email}
                  </div>
                  <div className="text-xs mt-2" style={{ color: t.textFaint }}>
                    IMAP: {(m as any).imapHost || "not configured"} • SMTP:{" "}
                    {(m as any).smtpHost || "not configured"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "workflows" && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                Workflows
              </h3>
              <button
                onClick={() => setShowAddWorkflow(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                <Plus className="w-3.5 h-3.5" /> Add workflow
              </button>
            </div>
            <div className="space-y-2">
              {workflows.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: t.readLeftBg }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-sm font-medium"
                      style={{ color: t.text }}
                    >
                      {w.name}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: w.active ? `${t.accent}22` : t.badgeBg,
                        color: w.active ? t.accent : t.textMuted,
                      }}
                    >
                      {w.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: t.textMuted }}>
                    If {w.conditions} then {w.actions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "modules" && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                FreeScout MegaPlan modules ({MODULES.length})
              </h3>
              <button
                onClick={async () => {
                  await api.updateBrand({ modules: enabledModules });
                  await refreshBrand();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                <Save className="w-3.5 h-3.5" /> Save modules
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {MODULES.map((mod) => (
                <button
                  key={mod}
                  onClick={() =>
                    setEnabledModules((prev) => ({
                      ...prev,
                      [mod]: !prev[mod],
                    }))
                  }
                  className="flex items-center justify-between p-3 rounded-lg text-left text-xs"
                  style={{ backgroundColor: t.readLeftBg, color: t.textSub }}
                >
                  {mod}
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: enabledModules[mod]
                        ? t.accent
                        : "transparent",
                      border: `1px solid ${
                        enabledModules[mod] ? t.accent : t.inputBorder
                      }`,
                    }}
                  >
                    {enabledModules[mod] && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === "brand" && (
          <div
            className="rounded-xl p-5 max-w-xl"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: t.text }}
            >
              Brand customization
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: t.textMuted }}
                >
                  Company name
                </label>
                <input
                  value={brandForm.companyName}
                  onChange={(e) =>
                    setBrandForm({ ...brandForm, companyName: e.target.value })
                  }
                  placeholder="Isotopiq Mail"
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
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: t.textMuted }}
                >
                  Primary color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandForm.primaryColor}
                    onChange={(e) =>
                      setBrandForm({
                        ...brandForm,
                        primaryColor: e.target.value,
                      })
                    }
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <span
                    className="text-sm font-mono"
                    style={{ color: t.textSub }}
                  >
                    {brandForm.primaryColor}
                  </span>
                </div>
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: t.textMuted }}
                >
                  Logo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="text-sm mb-2"
                  style={{ color: t.textSub }}
                />
                {logoUrl && !logoFile && (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-12 w-auto rounded object-contain"
                  />
                )}
                {logoFile && (
                  <img
                    src={URL.createObjectURL(logoFile)}
                    alt="New logo"
                    className="h-12 w-auto rounded object-contain"
                  />
                )}
              </div>

              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: t.textMuted }}
                >
                  Favicon
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                  className="text-sm mb-2"
                  style={{ color: t.textSub }}
                />
                {faviconUrl && !faviconFile && (
                  <img
                    src={faviconUrl}
                    alt="Favicon preview"
                    className="h-8 w-auto rounded object-contain"
                  />
                )}
                {faviconFile && (
                  <img
                    src={URL.createObjectURL(faviconFile)}
                    alt="New favicon"
                    className="h-8 w-auto rounded object-contain"
                  />
                )}
              </div>

              <button
                onClick={submitBrand}
                disabled={brandLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: t.accentGrad }}
              >
                {brandLoading ? "Saving..." : "Save brand"}
              </button>
            </div>
          </div>
        )}

        {showAddUser && (
          <Modal
            title="Add user"
            t={t}
            onClose={() => setShowAddUser(false)}
            onSubmit={submitUser}
          >
            <input
              value={userForm.name}
              onChange={(e) =>
                setUserForm({ ...userForm, name: e.target.value })
              }
              placeholder="Name"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              value={userForm.email}
              onChange={(e) =>
                setUserForm({ ...userForm, email: e.target.value })
              }
              placeholder="Email"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              type="password"
              value={userForm.password}
              onChange={(e) =>
                setUserForm({ ...userForm, password: e.target.value })
              }
              placeholder="Password"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <select
              value={userForm.role}
              onChange={(e) =>
                setUserForm({ ...userForm, role: e.target.value as any })
              }
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            >
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="customer">Customer</option>
            </select>
          </Modal>
        )}

        {showAddMailbox && (
          <Modal
            title={editingMailboxId ? "Edit mailbox" : "Add mailbox"}
            t={t}
            onClose={() => {
              setShowAddMailbox(false);
              setEditingMailboxId(null);
            }}
            onSubmit={submitMailbox}
          >
            <input
              value={mbForm.name}
              onChange={(e) => setMbForm({ ...mbForm, name: e.target.value })}
              placeholder="Mailbox name"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              value={mbForm.email}
              onChange={(e) => setMbForm({ ...mbForm, email: e.target.value })}
              placeholder="Email address"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              type="color"
              value={mbForm.color}
              onChange={(e) => setMbForm({ ...mbForm, color: e.target.value })}
              className="w-full h-10 rounded-lg mb-4"
            />

            <div
              className="text-xs font-semibold mb-2 pb-1 border-b"
              style={{ color: t.textMuted, borderColor: t.divider }}
            >
              IMAP (incoming)
            </div>
            <input
              value={mbForm.imapHost}
              onChange={(e) => setMbForm({ ...mbForm, imapHost: e.target.value })}
              placeholder="IMAP host (e.g. imap.gmail.com)"
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={mbForm.imapPort}
                onChange={(e) =>
                  setMbForm({ ...mbForm, imapPort: parseInt(e.target.value) || 993 })
                }
                placeholder="Port"
                className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <label
                className="flex items-center gap-2 text-xs"
                style={{ color: t.textSub }}
              >
                <input
                  type="checkbox"
                  checked={mbForm.imapSecure}
                  onChange={(e) =>
                    setMbForm({ ...mbForm, imapSecure: e.target.checked })
                  }
                />
                SSL/TLS
              </label>
            </div>
            <input
              value={mbForm.imapUser}
              onChange={(e) => setMbForm({ ...mbForm, imapUser: e.target.value })}
              placeholder="IMAP username"
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              type="password"
              value={mbForm.imapPassword}
              onChange={(e) =>
                setMbForm({ ...mbForm, imapPassword: e.target.value })
              }
              placeholder="IMAP password"
              className="w-full px-3 py-2 rounded-lg text-sm mb-4 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />

            <div
              className="text-xs font-semibold mb-2 pb-1 border-b"
              style={{ color: t.textMuted, borderColor: t.divider }}
            >
              SMTP (outgoing)
            </div>
            <input
              value={mbForm.smtpHost}
              onChange={(e) => setMbForm({ ...mbForm, smtpHost: e.target.value })}
              placeholder="SMTP host (e.g. smtp.gmail.com)"
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={mbForm.smtpPort}
                onChange={(e) =>
                  setMbForm({ ...mbForm, smtpPort: parseInt(e.target.value) || 587 })
                }
                placeholder="Port"
                className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
                style={{
                  backgroundColor: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.text,
                }}
              />
              <label
                className="flex items-center gap-2 text-xs"
                style={{ color: t.textSub }}
              >
                <input
                  type="checkbox"
                  checked={mbForm.smtpSecure}
                  onChange={(e) =>
                    setMbForm({ ...mbForm, smtpSecure: e.target.checked })
                  }
                />
                SSL/TLS
              </label>
            </div>
            <input
              value={mbForm.smtpUser}
              onChange={(e) => setMbForm({ ...mbForm, smtpUser: e.target.value })}
              placeholder="SMTP username"
              className="w-full px-3 py-2 rounded-lg text-sm mb-2 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              type="password"
              value={mbForm.smtpPassword}
              onChange={(e) =>
                setMbForm({ ...mbForm, smtpPassword: e.target.value })
              }
              placeholder="SMTP password"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
          </Modal>
        )}

        {showAddWorkflow && (
          <Modal
            title="Add workflow"
            t={t}
            onClose={() => setShowAddWorkflow(false)}
            onSubmit={submitWorkflow}
          >
            <input
              value={wfForm.name}
              onChange={(e) => setWfForm({ ...wfForm, name: e.target.value })}
              placeholder="Workflow name"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              value={wfForm.conditions}
              onChange={(e) =>
                setWfForm({ ...wfForm, conditions: e.target.value })
              }
              placeholder="Condition (e.g. mailbox == sales)"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              value={wfForm.actions}
              onChange={(e) =>
                setWfForm({ ...wfForm, actions: e.target.value })
              }
              placeholder="Actions (e.g. assign u_sarah; tag partnership)"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
          </Modal>
        )}
      </div>
    </Layout>
  );
}

function Modal({
  title,
  t,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  t: any;
  onClose: () => void;
  onSubmit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ backgroundColor: t.readLeftBg, boxShadow: t.shadow }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold" style={{ color: t.text }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1"
            style={{ color: t.textSub }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ color: t.textSub }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: t.accentGrad }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
