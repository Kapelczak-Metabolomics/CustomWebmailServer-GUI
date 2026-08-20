import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import { useTheme } from "../theme";
import { useStore } from "../store";
import { api } from "../lib/api";
import {
  Users,
  Users2,
  SlidersHorizontal,
  Mail,
  Workflow,
  Plus,
  X,
  Check,
  Package,
  Palette,
  Save,
  Trash2,
  Pencil,
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
  const teams = useStore((s) => s.teams);
  const customFields = useStore((s) => s.customFields);
  const currentUser = useStore((s) => s.currentUser);
  const addUser = useStore((s) => s.addUser);
  const addMailbox = useStore((s) => s.addMailbox);
  const updateMailbox = useStore((s) => s.updateMailbox);
  const deleteMailbox = useStore((s) => s.deleteMailbox);
  const deleteUser = useStore((s) => s.deleteUser);
  const updateUser = useStore((s) => s.updateUser);
  const addWorkflow = useStore((s) => s.addWorkflow);
  const deleteWorkflow = useStore((s) => s.deleteWorkflow);
  const updateWorkflow = useStore((s) => s.updateWorkflow);
  const createTeam = useStore((s) => s.createTeam);
  const updateTeam = useStore((s) => s.updateTeam);
  const deleteTeam = useStore((s) => s.deleteTeam);
  const addTeamMember = useStore((s) => s.addTeamMember);
  const removeTeamMember = useStore((s) => s.removeTeamMember);
  const createCustomField = useStore((s) => s.createCustomField);
  const updateCustomField = useStore((s) => s.updateCustomField);
  const deleteCustomField = useStore((s) => s.deleteCustomField);

  const [activeTab, setActiveTab] = useState<
    | "users"
    | "mailboxes"
    | "workflows"
    | "modules"
    | "brand"
    | "teams"
    | "customFields"
  >("users");
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddMailbox, setShowAddMailbox] = useState(false);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [editingMailboxId, setEditingMailboxId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(
    null,
  );
  const [showEditWorkflow, setShowEditWorkflow] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    name: "",
    email: "",
    role: "agent" as any,
  });
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
    active: true,
  });
  const [brandForm, setBrandForm] = useState({
    companyName: "",
    primaryColor: "#2896E8",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [brandLoading, setBrandLoading] = useState(false);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    memberIds: [] as string[],
  });

  const [showAddField, setShowAddField] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [showEditField, setShowEditField] = useState(false);
  const [cfForm, setCfForm] = useState({
    name: "",
    type: "text" as "text" | "number" | "date" | "select",
    target: "contact" as "contact" | "conversation" | "user",
    options: "",
  });

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
    if (editingWorkflowId) {
      await updateWorkflow({
        id: editingWorkflowId,
        name: wfForm.name,
        conditions: wfForm.conditions,
        actions: wfForm.actions,
        active: wfForm.active,
      });
    } else {
      await addWorkflow({
        name: wfForm.name,
        conditions: wfForm.conditions,
        actions: wfForm.actions,
      });
    }
    setWfForm({ name: "", conditions: "", actions: "", active: true });
    setEditingWorkflowId(null);
    setShowAddWorkflow(false);
    setShowEditWorkflow(false);
  }

  function editWorkflow(w: any) {
    setEditingWorkflowId(w.id);
    setWfForm({
      name: w.name || "",
      conditions: w.conditions || "",
      actions: w.actions || "",
      active: w.active ?? true,
    });
    setShowEditWorkflow(true);
  }

  function editUser(u: any) {
    setEditingUserId(u.id);
    setEditUserForm({
      name: u.name || "",
      email: u.email || "",
      role: u.role || "agent",
    });
    setShowEditUser(true);
  }

  async function submitEditUser() {
    if (!editingUserId) return;
    await updateUser(editingUserId, {
      name: editUserForm.name,
      email: editUserForm.email,
      role: editUserForm.role,
    });
    setEditingUserId(null);
    setShowEditUser(false);
  }

  async function submitTeam() {
    if (!teamForm.name) return;
    if (editingTeamId) {
      const team = teams.find((tm) => tm.id === editingTeamId);
      const existingIds = new Set(
        (team?.members || []).map((m) => m.userId),
      );
      const desiredIds = new Set(teamForm.memberIds);
      await updateTeam(editingTeamId, {
        name: teamForm.name,
        description: teamForm.description,
      });
      for (const uid of desiredIds) {
        if (!existingIds.has(uid)) await addTeamMember(editingTeamId, uid);
      }
      for (const uid of existingIds) {
        if (!desiredIds.has(uid)) await removeTeamMember(editingTeamId, uid);
      }
    } else {
      await createTeam({
        name: teamForm.name,
        description: teamForm.description,
        memberIds: teamForm.memberIds,
      });
    }
    setTeamForm({ name: "", description: "", memberIds: [] });
    setEditingTeamId(null);
    setShowAddTeam(false);
    setShowEditTeam(false);
  }

  function editTeam(team: any) {
    setEditingTeamId(team.id);
    setTeamForm({
      name: team.name || "",
      description: team.description || "",
      memberIds: (team.members || []).map((m: any) => m.userId),
    });
    setShowEditTeam(true);
  }

  async function submitCustomField() {
    if (!cfForm.name) return;
    const data: any = {
      name: cfForm.name,
      type: cfForm.type,
      target: cfForm.target,
    };
    if (cfForm.type === "select") data.options = cfForm.options;
    if (editingFieldId) {
      await updateCustomField(editingFieldId, data);
    } else {
      await createCustomField(data);
    }
    setCfForm({
      name: "",
      type: "text",
      target: "contact",
      options: "",
    });
    setEditingFieldId(null);
    setShowAddField(false);
    setShowEditField(false);
  }

  function editCustomField(f: any) {
    setEditingFieldId(f.id);
    setCfForm({
      name: f.name || "",
      type: (f.type as any) || "text",
      target: (f.target as any) || "contact",
      options: f.options || "",
    });
    setShowEditField(true);
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

  async function submitBrand() {
    setBrandLoading(true);
    const data: any = { ...brandForm };
    try {
      if (logoFile) {
        const { url } = await api.uploadAttachment(logoFile);
        data.logoS3Key = url;
      }
      if (faviconFile) {
        const { url } = await api.uploadAttachment(faviconFile);
        data.faviconS3Key = url;
      }
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
          <TabButton id="teams" label="Teams" icon={Users2} />
          <TabButton id="customFields" label="Custom Fields" icon={SlidersHorizontal} />
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
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => editUser(u)}
                      className="p-1.5 rounded-lg"
                      style={{
                        color: t.accent,
                        backgroundColor: `${t.accent}15`,
                      }}
                      title="Edit user"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          currentUser &&
                          u.id === currentUser.id
                        )
                          return;
                        if (
                          window.confirm(
                            `Delete user "${u.name}"? This cannot be undone.`,
                          )
                        ) {
                          deleteUser(u.id);
                        }
                      }}
                      disabled={currentUser ? u.id === currentUser.id : false}
                      className="p-1.5 rounded-lg disabled:opacity-40"
                      style={{
                        color: "#EF4444",
                        backgroundColor: "#EF444415",
                      }}
                      title={
                        currentUser && u.id === currentUser.id
                          ? "You cannot delete your own account"
                          : "Delete user"
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                    <div className="flex items-center gap-1.5">
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
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete mailbox "${m.name}"? This cannot be undone.`,
                            )
                          ) {
                            deleteMailbox(m.id);
                          }
                        }}
                        className="p-1.5 rounded-lg"
                        style={{
                          color: "#EF4444",
                          backgroundColor: "#EF444415",
                        }}
                        title="Delete mailbox"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: w.active
                            ? `${t.accent}22`
                            : t.badgeBg,
                          color: w.active ? t.accent : t.textMuted,
                        }}
                      >
                        {w.active ? "Active" : "Inactive"}
                      </span>
                      <button
                        onClick={() => editWorkflow(w)}
                        className="p-1.5 rounded-lg"
                        style={{
                          color: t.accent,
                          backgroundColor: `${t.accent}15`,
                        }}
                        title="Edit workflow"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete workflow "${w.name}"? This cannot be undone.`,
                            )
                          ) {
                            deleteWorkflow(w.id);
                          }
                        }}
                        className="p-1.5 rounded-lg"
                        style={{
                          color: "#EF4444",
                          backgroundColor: "#EF444415",
                        }}
                        title="Delete workflow"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs mt-1" style={{ color: t.textMuted }}>
                    If {w.conditions} then {w.actions}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "teams" && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                Teams
              </h3>
              <button
                onClick={() => setShowAddTeam(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                <Plus className="w-3.5 h-3.5" /> Add team
              </button>
            </div>
            <div className="space-y-2">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="p-3 rounded-lg"
                  style={{ backgroundColor: t.readLeftBg }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: t.text }}
                      >
                        {team.name}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${t.accent}22`,
                          color: t.accent,
                        }}
                      >
                        {team.members.length} member
                        {team.members.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => editTeam(team)}
                        className="p-1.5 rounded-lg"
                        style={{
                          color: t.accent,
                          backgroundColor: `${t.accent}15`,
                        }}
                        title="Edit team"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete team "${team.name}"? This cannot be undone.`,
                            )
                          ) {
                            deleteTeam(team.id);
                          }
                        }}
                        className="p-1.5 rounded-lg"
                        style={{
                          color: "#EF4444",
                          backgroundColor: "#EF444415",
                        }}
                        title="Delete team"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {team.description && (
                    <div
                      className="text-xs mt-1"
                      style={{ color: t.textMuted }}
                    >
                      {team.description}
                    </div>
                  )}
                  {team.members.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {team.members.map((m) => (
                        <span
                          key={m.userId}
                          className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: t.inputBg,
                            color: t.textSub,
                          }}
                          title={m.user.email}
                        >
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                            style={{ backgroundColor: t.accent }}
                          >
                            {m.user.name.charAt(0).toUpperCase()}
                          </span>
                          {m.user.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {teams.length === 0 && (
                <div
                  className="text-xs text-center py-6"
                  style={{ color: t.textMuted }}
                >
                  No teams yet. Click "Add team" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "customFields" && (
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: t.card,
              border: `1px solid ${t.cardBorder}`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: t.text }}>
                Custom fields
              </h3>
              <button
                onClick={() => setShowAddField(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: t.accentGrad }}
              >
                <Plus className="w-3.5 h-3.5" /> Add field
              </button>
            </div>
            <div className="space-y-2">
              {customFields.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: t.readLeftBg }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: t.text }}
                    >
                      {f.name}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${t.accent}22`,
                        color: t.accent,
                      }}
                    >
                      {f.type}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: t.badgeBg,
                        color: t.textMuted,
                      }}
                    >
                      {f.target}
                    </span>
                    {f.type === "select" && f.options && (
                      <span
                        className="text-xs"
                        style={{ color: t.textMuted }}
                      >
                        ({f.options})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editCustomField(f)}
                      className="p-1.5 rounded-lg"
                      style={{
                        color: t.accent,
                        backgroundColor: `${t.accent}15`,
                      }}
                      title="Edit field"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete field "${f.name}"? This cannot be undone.`,
                          )
                        ) {
                          deleteCustomField(f.id);
                        }
                      }}
                      className="p-1.5 rounded-lg"
                      style={{
                        color: "#EF4444",
                        backgroundColor: "#EF444415",
                      }}
                      title="Delete field"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {customFields.length === 0 && (
                <div
                  className="text-xs text-center py-6"
                  style={{ color: t.textMuted }}
                >
                  No custom fields yet. Click "Add field" to create one.
                </div>
              )}
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

        {showEditUser && (
          <Modal
            title="Edit user"
            t={t}
            onClose={() => {
              setShowEditUser(false);
              setEditingUserId(null);
            }}
            onSubmit={submitEditUser}
          >
            <input
              value={editUserForm.name}
              onChange={(e) =>
                setEditUserForm({ ...editUserForm, name: e.target.value })
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
              value={editUserForm.email}
              onChange={(e) =>
                setEditUserForm({ ...editUserForm, email: e.target.value })
              }
              placeholder="Email"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <select
              value={editUserForm.role}
              onChange={(e) =>
                setEditUserForm({
                  ...editUserForm,
                  role: e.target.value as any,
                })
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

        {showEditWorkflow && (
          <Modal
            title="Edit workflow"
            t={t}
            onClose={() => {
              setShowEditWorkflow(false);
              setEditingWorkflowId(null);
            }}
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
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
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
                checked={wfForm.active}
                onChange={(e) =>
                  setWfForm({ ...wfForm, active: e.target.checked })
                }
              />
              Active
            </label>
          </Modal>
        )}

        {(showAddTeam || showEditTeam) && (
          <Modal
            title={editingTeamId ? "Edit team" : "Add team"}
            t={t}
            onClose={() => {
              setShowAddTeam(false);
              setShowEditTeam(false);
              setEditingTeamId(null);
              setTeamForm({ name: "", description: "", memberIds: [] });
            }}
            onSubmit={submitTeam}
          >
            <input
              value={teamForm.name}
              onChange={(e) =>
                setTeamForm({ ...teamForm, name: e.target.value })
              }
              placeholder="Team name"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <input
              value={teamForm.description}
              onChange={(e) =>
                setTeamForm({ ...teamForm, description: e.target.value })
              }
              placeholder="Description (optional)"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
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
              Members
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {users.map((u) => {
                const checked = teamForm.memberIds.includes(u.id);
                return (
                  <label
                    key={u.id}
                    className="flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer"
                    style={{
                      backgroundColor: checked
                        ? `${t.accent}12`
                        : "transparent",
                      color: t.textSub,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setTeamForm((prev) => ({
                          ...prev,
                          memberIds: e.target.checked
                            ? [...prev.memberIds, u.id]
                            : prev.memberIds.filter((id) => id !== u.id),
                        }));
                      }}
                    />
                    <span style={{ color: t.text }}>{u.name}</span>
                    <span style={{ color: t.textMuted }}>
                      • {u.email} • {u.role}
                    </span>
                  </label>
                );
              })}
              {users.length === 0 && (
                <div
                  className="text-xs text-center py-4"
                  style={{ color: t.textMuted }}
                >
                  No users available.
                </div>
              )}
            </div>
          </Modal>
        )}

        {(showAddField || showEditField) && (
          <Modal
            title={editingFieldId ? "Edit field" : "Add field"}
            t={t}
            onClose={() => {
              setShowAddField(false);
              setShowEditField(false);
              setEditingFieldId(null);
              setCfForm({
                name: "",
                type: "text",
                target: "contact",
                options: "",
              });
            }}
            onSubmit={submitCustomField}
          >
            <input
              value={cfForm.name}
              onChange={(e) => setCfForm({ ...cfForm, name: e.target.value })}
              placeholder="Field name"
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            />
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: t.textMuted }}
            >
              Type
            </label>
            <select
              value={cfForm.type}
              onChange={(e) =>
                setCfForm({ ...cfForm, type: e.target.value as any })
              }
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="select">Select</option>
            </select>
            <label
              className="block text-xs font-medium mb-1.5"
              style={{ color: t.textMuted }}
            >
              Target
            </label>
            <select
              value={cfForm.target}
              onChange={(e) =>
                setCfForm({ ...cfForm, target: e.target.value as any })
              }
              className="w-full px-3 py-2 rounded-lg text-sm mb-3 outline-none"
              style={{
                backgroundColor: t.inputBg,
                border: `1px solid ${t.inputBorder}`,
                color: t.text,
              }}
            >
              <option value="contact">Contact</option>
              <option value="conversation">Conversation</option>
              <option value="user">User</option>
            </select>
            {cfForm.type === "select" && (
              <>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: t.textMuted }}
                >
                  Options (comma-separated)
                </label>
                <input
                  value={cfForm.options}
                  onChange={(e) =>
                    setCfForm({ ...cfForm, options: e.target.value })
                  }
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    color: t.text,
                  }}
                />
              </>
            )}
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
