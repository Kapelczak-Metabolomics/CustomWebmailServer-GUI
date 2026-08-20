import { create } from "zustand";
import type {
  AppSettings,
  Contact,
  Conversation,
  ConversationStatus,
  Folder,
  KnowledgeBaseArticle,
  Mailbox,
  Message,
  Note,
  Priority,
  SavedReply,
  Tag,
  Team,
  CustomField,
  User,
  Workflow,
  Role,
} from "./types";
import { toast } from "./components/ui/toastStore";
import { defaultSettings } from "./lib/mock";
import {
  api,
  toUser,
  toMailbox,
  toContact,
  toConversation,
  toMessage,
  getInitials,
} from "./lib/api";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface StoreState {
  currentUser: User | null;
  users: User[];
  mailboxes: Mailbox[];
  contacts: Contact[];
  conversations: Conversation[];
  messages: Message[];
  tags: Tag[];
  savedReplies: SavedReply[];
  workflows: Workflow[];
  articles: KnowledgeBaseArticle[];
  notifications: Notification[];
  settings: AppSettings;
  teams: Team[];
  customFields: CustomField[];
  ui: {
    folder: Folder;
    selectedId: string | null;
    mailboxFilter: string | "all";
    search: string;
    composeOpen: boolean;
  };
  isAuthLoading: boolean;

  // auth
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  loadData: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<boolean>;

  // conversations
  selectConversation: (id: string | null) => void;
  setFolder: (folder: Folder) => void;
  setMailboxFilter: (id: string | "all") => void;
  setSearch: (q: string) => void;
  toggleStar: (conversationId: string) => Promise<void>;
  changeFolder: (conversationId: string, folder: Folder) => Promise<void>;
  markRead: (conversationId: string, userId: string) => void;
  setStatus: (
    conversationId: string,
    status: ConversationStatus,
  ) => Promise<void>;
  setPriority: (conversationId: string, priority: Priority) => Promise<void>;
  assign: (conversationId: string, userId: string | undefined) => Promise<void>;
  addTagToConversation: (
    conversationId: string,
    tagId: string,
  ) => Promise<void>;
  removeTagFromConversation: (
    conversationId: string,
    tagId: string,
  ) => Promise<void>;
  addLabel: (conversationId: string, label: string) => void;
  removeLabel: (conversationId: string, label: string) => void;
  sendMessage: (
    conversationId: string,
    data: Partial<Message>,
  ) => Promise<void>;
  sendReply: (
    conversationId: string,
    body: string,
    type?: Message["type"],
  ) => Promise<void>;
  createConversation: (
    data: Partial<Conversation> & {
      subject: string;
      mailboxId: string;
      customerId: string;
      body?: string;
      internalNote?: string;
    },
  ) => Promise<Conversation>;
  setComposeOpen: (open: boolean) => void;

  // contacts
  addContact: (
    data: Partial<Contact> & {
      name: string;
      email: string;
    },
  ) => Promise<Contact>;
  addNote: (contactId: string, body: string, authorId: string) => Promise<void>;

  // settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
  followConversation: (conversationId: string) => Promise<void>;
  unfollowConversation: (conversationId: string) => Promise<void>;
  snoozeConversation: (conversationId: string, until: string) => Promise<void>;
  forwardConversation: (
    conversationId: string,
    to: string,
    note: string,
  ) => Promise<void>;
  updateMailbox: (
    id: string,
    data: Partial<Mailbox> & Record<string, any>,
  ) => Promise<void>;
  addMailbox: (
    data: Partial<Mailbox> & {
      name: string;
      email: string;
    },
  ) => Promise<Mailbox>;
  createTag: (name: string, color: string) => Promise<Tag>;
  addSavedReply: (
    data: Partial<SavedReply> & {
      name: string;
      body: string;
    },
  ) => Promise<SavedReply>;
  addUser: (
    data: Partial<User> & {
      name: string;
      email: string;
      role: Role;
      password?: string;
    },
  ) => Promise<User>;
  addWorkflow: (
    data: Partial<Workflow> & {
      name: string;
      conditions: string;
      actions: string;
    },
  ) => Promise<Workflow>;
  addArticle: (
    data: Partial<KnowledgeBaseArticle> & {
      title: string;
      body: string;
      category: string;
    },
  ) => Promise<KnowledgeBaseArticle>;

  // delete/update actions
  deleteMailbox: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  updateUser: (
    id: string,
    data: Partial<User> & { password?: string },
  ) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  updateContact: (data: Partial<Contact> & { id: string }) => Promise<void>;
  deleteContactNote: (contactId: string, noteId: string) => Promise<void>;
  updateContactNote: (
    contactId: string,
    noteId: string,
    body: string,
  ) => Promise<void>;
  deleteSavedReply: (id: string) => Promise<void>;
  updateSavedReply: (
    data: Partial<SavedReply> & { id: string },
  ) => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  updateWorkflow: (
    data: Partial<Workflow> & { id: string },
  ) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  updateArticle: (
    data: Partial<KnowledgeBaseArticle> & { id: string },
  ) => Promise<void>;
  updateTag: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  updateMessage: (id: string, body: string) => Promise<void>;
  deleteChatRoom: (id: string) => Promise<void>;
  leaveChatRoom: (id: string) => Promise<void>;
  deleteVideoRoom: (id: string) => Promise<void>;
  leaveVideoRoom: (id: string) => Promise<void>;

  // teams
  createTeam: (data: {
    name: string;
    description?: string;
    memberIds?: string[];
  }) => Promise<any>;
  updateTeam: (
    id: string,
    data: { name?: string; description?: string },
  ) => Promise<void>;
  deleteTeam: (id: string) => Promise<void>;
  addTeamMember: (teamId: string, userId: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;

  // custom fields
  createCustomField: (data: {
    name: string;
    type: string;
    options?: string;
    target?: string;
  }) => Promise<any>;
  updateCustomField: (
    id: string,
    data: { name?: string; type?: string; options?: string; target?: string },
  ) => Promise<void>;
  deleteCustomField: (id: string) => Promise<void>;

  // notifications
  addNotification: (title: string, body: string) => void;
  markNotificationRead: (id: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  currentUser: null,
  users: [],
  mailboxes: [],
  contacts: [],
  conversations: [],
  messages: [],
  tags: [],
  savedReplies: [],
  workflows: [],
  articles: [],
  notifications: [],
  settings: defaultSettings,
  teams: [],
  customFields: [],
  ui: {
    folder: "inbox",
    selectedId: null,
    mailboxFilter: "all",
    search: "",
    composeOpen: false,
  },
  isAuthLoading: true,

  login: async (email, password) => {
    try {
      const user = await api.login(email, password);
      const mapped = toUser(user);
      set({ currentUser: mapped, isAuthLoading: false });
      await get().loadData();
      get().addNotification("Welcome back", `Signed in as ${mapped.name}`);
      return true;
    } catch (err: any) {
      console.error("Login failed:", err.message);
      return false;
    }
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {}
    set({
      currentUser: null,
      users: [],
      mailboxes: [],
      contacts: [],
      conversations: [],
      messages: [],
      isAuthLoading: false,
    });
  },

  restoreSession: async () => {
    try {
      const user = await api.me();
      const mapped = toUser(user);
      set({ currentUser: mapped, isAuthLoading: false });
      await get().loadData();
    } catch {
      set({ isAuthLoading: false });
    }
  },

  loadData: async () => {
    try {
      const [
        users,
        mailboxes,
        contacts,
        convs,
        tags,
        savedReplies,
        workflows,
        articles,
        settings,
        teams,
        customFields,
      ] = await Promise.all([
        api.listUsers(),
        api.listMailboxes(),
        api.listContacts(),
        api.listConversations({ limit: "100" }),
        api.listTags(),
        api.listSavedReplies(),
        api.listWorkflows(),
        api.listArticles(),
        api.getSettings().catch(() => null),
        api.listTeams().catch(() => []),
        api.listCustomFields().catch(() => []),
      ]);
      set({
        users,
        mailboxes,
        contacts,
        conversations: convs.items,
        messages: convs.messages,
        tags,
        savedReplies,
        workflows,
        articles,
        teams: teams || [],
        customFields: customFields || [],
        settings: settings
          ? {
              companyName: settings.companyName || "",
              defaultMailboxId: settings.defaultMailboxId || "",
              officeHours: settings.officeHours || "",
              autoReply: settings.autoReply ?? false,
              whiteLabel: settings.whiteLabel ?? false,
              forceReadReceipts: settings.forceReadReceipts ?? false,
              darkMode: get().settings.darkMode,
            }
          : get().settings,
      });
    } catch (err: any) {
      console.error("Failed to load data:", err.message);
    }
  },

  updateProfile: async (data) => {
    try {
      const user = toUser(await api.updateMe(data));
      set((state) => ({
        currentUser: user,
        users: state.users.map((u) => (u.id === user.id ? user : u)),
      }));
      return;
    } catch (err: any) {
      console.error("Profile update failed:", err.message);
      throw err;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      await api.changePassword(currentPassword, newPassword);
      return true;
    } catch (err: any) {
      console.error("Password change failed:", err.message);
      return false;
    }
  },

  selectConversation: (id) => {
    set((state) => ({ ui: { ...state.ui, selectedId: id } }));
    if (id) {
      const currentUser = get().currentUser;
      if (currentUser) get().markRead(id, currentUser.id);
      api.getConversation(id).then(({ conversation, messages }) => {
        set((state) => ({
          conversations: state.conversations.some(
            (c) => c.id === conversation.id,
          )
            ? state.conversations.map((c) =>
                c.id === conversation.id ? conversation : c,
              )
            : [conversation, ...state.conversations],
          messages: [
            ...state.messages.filter((m) => m.conversationId !== id),
            ...messages,
          ],
        }));
      });
    }
  },

  setFolder: (folder) =>
    set((state) => ({ ui: { ...state.ui, folder, selectedId: null } })),

  setMailboxFilter: (mailboxFilter) =>
    set((state) => ({ ui: { ...state.ui, mailboxFilter } })),

  setSearch: (search) => set((state) => ({ ui: { ...state.ui, search } })),

  toggleStar: async (conversationId) => {
    const c = get().conversations.find((x) => x.id === conversationId);
    if (!c) return;
    const folder: Folder = c.starred ? "inbox" : "starred";
    const updated = {
      ...c,
      starred: !c.starred,
      folder,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      conversations: state.conversations.map((x) =>
        x.id === conversationId ? updated : x,
      ),
    }));
    await api.updateConversation(conversationId, { folder });
  },

  changeFolder: async (conversationId, folder) => {
    const c = get().conversations.find((x) => x.id === conversationId);
    if (!c) return;
    const starred = folder === "starred";
    const updated = {
      ...c,
      folder,
      starred,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      conversations: state.conversations.map((x) =>
        x.id === conversationId ? updated : x,
      ),
    }));
    await api.updateConversation(conversationId, { folder });
  },

  markRead: (conversationId, userId) => {
    const conversation = get().conversations.find(
      (c) => c.id === conversationId,
    );
    if (!conversation || conversation.readBy.includes(userId)) return;
    const readBy = [...new Set([...conversation.readBy, userId])];
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, readBy, updatedAt: new Date().toISOString() }
          : c,
      ),
    }));
    api.updateConversation(conversationId, { readBy }).catch(() => {});
  },

  setStatus: async (conversationId, status) => {
    const c = get().conversations.find((x) => x.id === conversationId);
    if (!c) return;
    const updated = { ...c, status, updatedAt: new Date().toISOString() };
    set((state) => ({
      conversations: state.conversations.map((x) =>
        x.id === conversationId ? updated : x,
      ),
    }));
    await api.updateConversation(conversationId, { status });
  },

  setPriority: async (conversationId, priority) => {
    const c = get().conversations.find((x) => x.id === conversationId);
    if (!c) return;
    const updated = { ...c, priority, updatedAt: new Date().toISOString() };
    set((state) => ({
      conversations: state.conversations.map((x) =>
        x.id === conversationId ? updated : x,
      ),
    }));
    await api.updateConversation(conversationId, { priority });
  },

  assign: async (conversationId, userId) => {
    const c = get().conversations.find((x) => x.id === conversationId);
    if (!c) return;
    const updated = {
      ...c,
      assigneeId: userId,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      conversations: state.conversations.map((x) =>
        x.id === conversationId ? updated : x,
      ),
    }));
    await api.updateConversation(conversationId, { assigneeId: userId });
  },

  addTagToConversation: async (conversationId, tagId) => {
    await api.addTagToConversation(conversationId, tagId);
    const tag = get().tags.find((t) => t.id === tagId);
    const label = tag ? tag.name : tagId;
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId && !c.tags.includes(label)
          ? {
              ...c,
              tags: [...c.tags, label],
              labels: c.labels.includes(label)
                ? c.labels
                : [...c.labels, label],
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    }));
  },

  removeTagFromConversation: async (conversationId, tagId) => {
    await api.removeTagFromConversation(conversationId, tagId);
    const tag = get().tags.find((t) => t.id === tagId);
    const label = tag ? tag.name : tagId;
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              tags: c.tags.filter((t) => t !== label),
              labels: c.labels.filter((l) => l !== label),
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    }));
  },

  addLabel: (conversationId, label) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId && !c.labels.includes(label)
          ? {
              ...c,
              labels: [...c.labels, label],
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    })),

  removeLabel: (conversationId, label) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              labels: c.labels.filter((l) => l !== label),
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    })),

  sendMessage: async (conversationId, data) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    const body = data.body || "";
    const type = data.type === "internal" ? "note" : data.type || "reply";
    const msg = await api.sendMessage({
      conversationId,
      type,
      body,
      to: data.to || [],
      cc: data.cc || [],
      bcc: data.bcc || [],
    });
    set((state) => ({
      messages: [...state.messages, msg],
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, updatedAt: new Date().toISOString() }
          : c,
      ),
    }));
    if (type === "note") toast("Note added", "success");
    else if (type === "reply") toast("Reply sent", "success");
  },

  sendReply: async (conversationId, body, type = "reply") => {
    await get().sendMessage(conversationId, { type, body, to: [] });
  },

  createConversation: async (data) => {
    const currentUser = get().currentUser;
    const { conversation, messages } = await api.createConversation({
      subject: data.subject,
      mailboxId: data.mailboxId,
      contactId: data.customerId,
      status: data.status || "open",
      priority: data.priority || "medium",
      source: data.source || "manual",
      body: data.body,
      internalNote: data.internalNote,
    });
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      messages: [...state.messages, ...messages],
    }));
    return conversation;
  },

  setComposeOpen: (open) =>
    set((state) => ({ ui: { ...state.ui, composeOpen: open } })),

  addContact: async (data) => {
    const contact = await api.createContact({
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
    });
    set((state) => ({ contacts: [contact, ...state.contacts] }));
    return contact;
  },

  addNote: async (contactId, body, authorId) => {
    const saved = await api.createContactNote(contactId, body, authorId);
    const note: Note = {
      id: saved.id,
      authorId: saved.authorId,
      body: saved.body,
      createdAt: saved.createdAt,
    };
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId ? { ...c, notes: [...c.notes, note] } : c,
      ),
    }));
  },

  updateSettings: async (settings) => {
    set((state) => ({ settings: { ...state.settings, ...settings } }));
    try {
      await api.updateSettings(settings);
    } catch (err: any) {
      console.error("Failed to persist settings:", err.message);
    }
  },

  followConversation: async (conversationId) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    await api.followConversation(conversationId);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId && !c.followers.includes(currentUser.id)
          ? { ...c, followers: [...c.followers, currentUser.id] }
          : c,
      ),
    }));
  },

  unfollowConversation: async (conversationId) => {
    const currentUser = get().currentUser;
    if (!currentUser) return;
    await api.unfollowConversation(conversationId);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              followers: c.followers.filter((id) => id !== currentUser.id),
            }
          : c,
      ),
    }));
  },

  snoozeConversation: async (conversationId, until) => {
    await api.snoozeConversation(conversationId, until);
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, snoozeUntil: until, updatedAt: new Date().toISOString() }
          : c,
      ),
    }));
  },

  forwardConversation: async (conversationId, to, note) => {
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (!conv) return;
    const messages = get().messages.filter(
      (m) => m.conversationId === conversationId,
    );
    const lastCustomer = [...messages]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .reverse()
      .find((m) => m.type === "customer" || m.type === "reply");
    const fwdBody = `<p>${note ? `<p>${note}</p>` : ""}</p><br/><p>--- Forwarded message ---</p><p>Subject: ${conv.subject}</p><p>${lastCustomer?.body || ""}</p>`;
    await api.sendMessage({
      conversationId,
      type: "forward",
      body: fwdBody,
      to: [to],
    });
  },

  updateMailbox: async (id, data) => {
    const mailbox = await api.updateMailbox(id, data);
    set((state) => ({
      mailboxes: state.mailboxes.map((m) => (m.id === id ? mailbox : m)),
    }));
  },

  addMailbox: async (data) => {
    const mailbox = await api.createMailbox({
      name: data.name,
      email: data.email,
      color: data.color,
      imapHost: (data as any).imapHost,
      imapPort: (data as any).imapPort,
      imapSecure: (data as any).imapSecure,
      imapUser: (data as any).imapUser,
      imapPassword: (data as any).imapPassword,
      smtpHost: (data as any).smtpHost,
      smtpPort: (data as any).smtpPort,
      smtpSecure: (data as any).smtpSecure,
      smtpUser: (data as any).smtpUser,
      smtpPassword: (data as any).smtpPassword,
    });
    set((state) => ({ mailboxes: [...state.mailboxes, mailbox] }));
    return mailbox;
  },

  createTag: async (name, color) => {
    const tag = await api.createTag(name, color);
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  addSavedReply: async (data) => {
    const reply = await api.createSavedReply({
      name: data.name,
      subject: data.subject || "",
      body: data.body,
      mailboxId: data.mailboxId,
    });
    set((state) => ({ savedReplies: [...state.savedReplies, reply] }));
    return reply;
  },

  addUser: async (data) => {
    const user = await api.createUser({
      name: data.name,
      email: data.email,
      role: data.role,
      password: (data as any).password,
      avatar: data.avatar,
      timezone: data.timezone || "UTC",
    });
    set((state) => ({ users: [...state.users, user] }));
    return user;
  },

  addWorkflow: async (data) => {
    const workflow = await api.createWorkflow({
      name: data.name,
      active: data.active ?? true,
      conditions: data.conditions,
      actions: data.actions,
    });
    set((state) => ({ workflows: [...state.workflows, workflow] }));
    return workflow;
  },

  addArticle: async (data) => {
    const article = await api.createArticle({
      title: data.title,
      category: data.category,
      body: data.body,
      published: data.published ?? true,
    });
    set((state) => ({ articles: [...state.articles, article] }));
    return article;
  },

  deleteMailbox: async (id) => {
    await api.deleteMailbox(id);
    set((state) => ({ mailboxes: state.mailboxes.filter((m) => m.id !== id) }));
    toast("Mailbox deleted", "success");
  },

  deleteUser: async (id) => {
    await api.deleteUser(id);
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
    toast("User deleted", "success");
  },

  updateUser: async (id, data) => {
    const user = await api.updateUser(id, data);
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? user : u)),
      currentUser: state.currentUser?.id === id ? user : state.currentUser,
    }));
  },

  deleteContact: async (id) => {
    await api.deleteContact(id);
    set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) }));
    toast("Contact deleted", "success");
  },

  updateContact: async (data) => {
    const contact = await api.updateContact(data.id, data);
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === data.id ? contact : c)),
    }));
  },

  deleteContactNote: async (contactId, noteId) => {
    await api.deleteContactNote(contactId, noteId);
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId
          ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) }
          : c,
      ),
    }));
  },

  updateContactNote: async (contactId, noteId, body) => {
    await api.updateContactNote(contactId, noteId, body);
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId
          ? {
              ...c,
              notes: c.notes.map((n) =>
                n.id === noteId ? { ...n, body } : n,
              ),
            }
          : c,
      ),
    }));
  },

  deleteSavedReply: async (id) => {
    await api.deleteSavedReply(id);
    set((state) => ({
      savedReplies: state.savedReplies.filter((r) => r.id !== id),
    }));
    toast("Saved reply deleted", "success");
  },

  updateSavedReply: async (data) => {
    const reply = await api.updateSavedReply(data.id, data);
    set((state) => ({
      savedReplies: state.savedReplies.map((r) =>
        r.id === data.id ? reply : r,
      ),
    }));
  },

  deleteWorkflow: async (id) => {
    await api.deleteWorkflow(id);
    set((state) => ({
      workflows: state.workflows.filter((w) => w.id !== id),
    }));
    toast("Workflow deleted", "success");
  },

  updateWorkflow: async (data) => {
    const workflow = await api.updateWorkflow(data.id, data);
    set((state) => ({
      workflows: state.workflows.map((w) =>
        w.id === data.id ? workflow : w,
      ),
    }));
  },

  deleteArticle: async (id) => {
    await api.deleteArticle(id);
    set((state) => ({
      articles: state.articles.filter((a) => a.id !== id),
    }));
    toast("Article deleted", "success");
  },

  updateArticle: async (data) => {
    const article = await api.updateArticle(data.id, data);
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === data.id ? article : a,
      ),
    }));
  },

  updateTag: async (id, data) => {
    await api.updateTag(id, data);
    set((state) => ({
      tags: state.tags.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }));
  },

  deleteConversation: async (id) => {
    await api.deleteConversation(id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      messages: state.messages.filter((m) => m.conversationId !== id),
      ui: state.ui.selectedId === id ? { ...state.ui, selectedId: null } : state.ui,
    }));
    toast("Conversation deleted", "success");
  },

  deleteMessage: async (id) => {
    await api.deleteMessage(id);
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
    toast("Message deleted", "success");
  },

  updateMessage: async (id, body) => {
    const msg = await api.updateMessage(id, body);
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? msg : m)),
    }));
  },

  deleteChatRoom: async (id) => {
    await api.deleteChatRoom(id);
    toast("Chat room deleted", "success");
  },

  leaveChatRoom: async (id) => {
    await api.leaveChatRoom(id);
    toast("Left chat room", "info");
  },

  deleteVideoRoom: async (id) => {
    await api.deleteVideoRoom(id);
    toast("Meeting deleted", "success");
  },

  leaveVideoRoom: async (id) => {
    await api.leaveVideoRoom(id);
    toast("Left meeting", "info");
  },

  // Teams
  createTeam: async (data: { name: string; description?: string; memberIds?: string[] }) => {
    const team = await api.createTeam(data);
    set((state) => ({ teams: [...state.teams, team] }));
    return team;
  },

  updateTeam: async (id: string, data: { name?: string; description?: string }) => {
    const team = await api.updateTeam(id, data);
    set((state) => ({
      teams: state.teams.map((t) => (t.id === id ? team : t)),
    }));
  },

  deleteTeam: async (id: string) => {
    await api.deleteTeam(id);
    set((state) => ({ teams: state.teams.filter((t) => t.id !== id) }));
    toast("Team deleted", "success");
  },

  addTeamMember: async (teamId: string, userId: string) => {
    await api.addTeamMember(teamId, userId);
    const teams = await api.listTeams();
    set({ teams });
  },

  removeTeamMember: async (teamId: string, userId: string) => {
    await api.removeTeamMember(teamId, userId);
    const teams = await api.listTeams();
    set({ teams });
  },

  // Custom fields
  createCustomField: async (data: { name: string; type: string; options?: string; target?: string }) => {
    const field = await api.createCustomField(data);
    set((state) => ({ customFields: [...state.customFields, field] }));
    return field;
  },

  updateCustomField: async (id: string, data: { name?: string; type?: string; options?: string; target?: string }) => {
    const field = await api.updateCustomField(id, data);
    set((state) => ({
      customFields: state.customFields.map((f) => (f.id === id ? field : f)),
    }));
  },

  deleteCustomField: async (id: string) => {
    await api.deleteCustomField(id);
    set((state) => ({
      customFields: state.customFields.filter((f) => f.id !== id),
    }));
    toast("Custom field deleted", "success");
  },

  addNotification: (title, body) => {
    const currentUser = get().currentUser;
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      userId: currentUser?.id || "unknown",
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
    })),
}));
