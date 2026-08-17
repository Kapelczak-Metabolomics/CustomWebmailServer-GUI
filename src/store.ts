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
  User,
  Workflow,
  Role,
} from "./types";
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
  addTagToConversation: (conversationId: string, tagId: string) => void;
  removeTagFromConversation: (conversationId: string, tagId: string) => void;
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
  addNote: (contactId: string, body: string, authorId: string) => void;

  // settings
  updateSettings: (settings: Partial<AppSettings>) => void;
  addMailbox: (
    data: Partial<Mailbox> & {
      name: string;
      email: string;
    },
  ) => Promise<Mailbox>;
  createTag: (name: string, color: string) => Tag;
  addSavedReply: (
    data: Partial<SavedReply> & {
      name: string;
      body: string;
    },
  ) => SavedReply;
  addUser: (
    data: Partial<User> & {
      name: string;
      email: string;
      role: Role;
    },
  ) => User;
  addWorkflow: (
    data: Partial<Workflow> & {
      name: string;
      conditions: string;
      actions: string;
    },
  ) => Workflow;
  addArticle: (
    data: Partial<KnowledgeBaseArticle> & {
      title: string;
      body: string;
      category: string;
    },
  ) => KnowledgeBaseArticle;

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
      const [users, mailboxes, contacts, convs] = await Promise.all([
        api.listUsers(),
        api.listMailboxes(),
        api.listContacts(),
        api.listConversations({ limit: "100" }),
      ]);
      set({
        users,
        mailboxes,
        contacts,
        conversations: convs.items,
        messages: convs.messages,
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
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId && !c.readBy.includes(userId)
          ? {
              ...c,
              readBy: [...c.readBy, userId],
              updatedAt: new Date().toISOString(),
            }
          : c,
      ),
    }));
    api
      .updateConversation(conversationId, {
        readBy: [
          ...(get().conversations.find((c) => c.id === conversationId)
            ?.readBy || []),
          userId,
        ],
      })
      .catch(() => {});
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

  addTagToConversation: (conversationId, tagId) =>
    set((state) => {
      const tag = state.tags.find((t) => t.id === tagId || t.name === tagId);
      const label = tag ? tag.name : tagId;
      return {
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
      };
    }),

  removeTagFromConversation: (conversationId, tagId) =>
    set((state) => {
      const tag = state.tags.find((t) => t.id === tagId || t.name === tagId);
      const label = tag ? tag.name : tagId;
      return {
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
      };
    }),

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

  addNote: (contactId, body, authorId) => {
    const note: Note = {
      id: `note-${Date.now()}`,
      authorId,
      body,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === contactId ? { ...c, notes: [...c.notes, note] } : c,
      ),
    }));
  },

  updateSettings: (settings) =>
    set((state) => ({ settings: { ...state.settings, ...settings } })),

  addMailbox: async (data) => {
    const mailbox = await api.createMailbox({
      name: data.name,
      email: data.email,
      color: data.color,
    });
    set((state) => ({ mailboxes: [...state.mailboxes, mailbox] }));
    return mailbox;
  },

  createTag: (name, color) => {
    const tag: Tag = { id: `t-${Date.now()}`, name, color };
    set((state) => ({ tags: [...state.tags, tag] }));
    return tag;
  },

  addSavedReply: (data) => {
    const reply: SavedReply = {
      id: `sr-${Date.now()}`,
      name: data.name,
      subject: data.subject || "",
      body: data.body,
      mailboxId: data.mailboxId,
    };
    set((state) => ({ savedReplies: [...state.savedReplies, reply] }));
    return reply;
  },

  addUser: (data) => {
    const user: User = {
      id: `u-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
      avatar: data.avatar,
      timezone: data.timezone || "UTC",
      status: "active",
      permissions: data.permissions || [],
      initials: getInitials(data.name),
    };
    set((state) => ({ users: [...state.users, user] }));
    return user;
  },

  addWorkflow: (data) => {
    const workflow: Workflow = {
      id: `wf-${Date.now()}`,
      name: data.name,
      active: data.active ?? true,
      conditions: data.conditions,
      actions: data.actions,
    };
    set((state) => ({ workflows: [...state.workflows, workflow] }));
    return workflow;
  },

  addArticle: (data) => {
    const slug = data.title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const article: KnowledgeBaseArticle = {
      id: `kb-${Date.now()}`,
      title: data.title,
      slug,
      category: data.category,
      body: data.body,
      published: data.published ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ articles: [...state.articles, article] }));
    return article;
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
