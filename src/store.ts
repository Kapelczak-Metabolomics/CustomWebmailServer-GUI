import { create } from "zustand"
import { persist } from "zustand/middleware"
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
} from "./types"
import { initialState } from "./lib/mock"
import { id, getInitials, formatRelative } from "./lib/utils"

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

interface StoreState {
  currentUser: User | null
  users: User[]
  mailboxes: Mailbox[]
  contacts: Contact[]
  conversations: Conversation[]
  messages: Message[]
  tags: Tag[]
  savedReplies: SavedReply[]
  workflows: Workflow[]
  articles: KnowledgeBaseArticle[]
  notifications: Notification[]
  settings: AppSettings
  ui: {
    folder: Folder
    selectedId: string | null
    mailboxFilter: string | "all"
    search: string
    composeOpen: boolean
  }

  // auth
  login: (email: string) => boolean
  logout: () => void

  // conversations
  selectConversation: (id: string | null) => void
  setFolder: (folder: Folder) => void
  setMailboxFilter: (id: string | "all") => void
  setSearch: (q: string) => void
  toggleStar: (conversationId: string) => void
  changeFolder: (conversationId: string, folder: Folder) => void
  markRead: (conversationId: string, userId: string) => void
  setStatus: (conversationId: string, status: ConversationStatus) => void
  setPriority: (conversationId: string, priority: Priority) => void
  assign: (conversationId: string, userId: string | undefined) => void
  addTagToConversation: (conversationId: string, tagId: string) => void
  removeTagFromConversation: (conversationId: string, tagId: string) => void
  addLabel: (conversationId: string, label: string) => void
  removeLabel: (conversationId: string, label: string) => void
  sendMessage: (conversationId: string, data: Partial<Message>) => void
  sendReply: (
    conversationId: string,
    body: string,
    type?: Message["type"],
  ) => void
  createConversation: (
    data: Partial<Conversation> & {
      subject: string
      mailboxId: string
      customerId: string
      body?: string
    },
  ) => Conversation
  setComposeOpen: (open: boolean) => void

  // contacts
  addContact: (
    data: Partial<Contact> & {
      name: string
      email: string
    },
  ) => Contact
  addNote: (contactId: string, body: string, authorId: string) => void

  // settings
  updateSettings: (settings: Partial<AppSettings>) => void
  addMailbox: (
    data: Partial<Mailbox> & {
      name: string
      email: string
    },
  ) => Mailbox
  createTag: (name: string, color: string) => Tag
  addSavedReply: (
    data: Partial<SavedReply> & {
      name: string
      body: string
    },
  ) => SavedReply
  addUser: (
    data: Partial<User> & {
      name: string
      email: string
      role: Role
    },
  ) => User
  addWorkflow: (
    data: Partial<Workflow> & {
      name: string
      conditions: string
      actions: string
    },
  ) => Workflow
  addArticle: (
    data: Partial<KnowledgeBaseArticle> & {
      title: string
      body: string
      category: string
    },
  ) => KnowledgeBaseArticle

  // notifications
  addNotification: (title: string, body: string) => void
  markNotificationRead: (id: string) => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      ui: {
        folder: "inbox",
        selectedId: null,
        mailboxFilter: "all",
        search: "",
        composeOpen: false,
      },

      login: (email) => {
        const user = get().users.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
        )
        if (!user) return false
        set({ currentUser: user })
        get().addNotification("Welcome back", `Signed in as ${user.name}`)
        return true
      },

      logout: () => set({ currentUser: null }),

      selectConversation: (id) => {
        const currentUser = get().currentUser
        if (id && currentUser) {
          get().markRead(id, currentUser.id)
        }
        set((state) => ({ ui: { ...state.ui, selectedId: id } }))
      },

      setFolder: (folder) =>
        set((state) => ({ ui: { ...state.ui, folder, selectedId: null } })),
      setMailboxFilter: (mailboxFilter) =>
        set((state) => ({ ui: { ...state.ui, mailboxFilter } })),
      setSearch: (search) => set((state) => ({ ui: { ...state.ui, search } })),

      toggleStar: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  starred: !c.starred,
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),

      changeFolder: (conversationId, folder) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, folder, updatedAt: new Date().toISOString() }
              : c,
          ),
          ui: { ...state.ui, selectedId: null },
        })),

      markRead: (conversationId, userId) =>
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
        })),

      setStatus: (conversationId, status) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, status, updatedAt: new Date().toISOString() }
              : c,
          ),
        })),

      setPriority: (conversationId, priority) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, priority, updatedAt: new Date().toISOString() }
              : c,
          ),
        })),

      assign: (conversationId, userId) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  assigneeId: userId,
                  updatedAt: new Date().toISOString(),
                }
              : c,
          ),
        })),

      addTagToConversation: (conversationId, tagId) =>
        set((state) => {
          const tag = state.tags.find((t) => t.id === tagId || t.name === tagId)
          const label = tag ? tag.name : tagId
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
          }
        }),

      removeTagFromConversation: (conversationId, tagId) =>
        set((state) => {
          const tag = state.tags.find((t) => t.id === tagId || t.name === tagId)
          const label = tag ? tag.name : tagId
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
          }
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

      sendMessage: (conversationId, data) => {
        const message: Message = {
          id: id("msg"),
          conversationId,
          type: data.type || "reply",
          authorId: data.authorId || get().currentUser?.id || "system",
          authorType: data.authorType || "agent",
          body: data.body || "",
          bodyText: data.bodyText || (data.body || "").replace(/<[^>]+>/g, ""),
          to: data.to || [],
          cc: data.cc || [],
          bcc: data.bcc || [],
          attachments: data.attachments || [],
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          messages: [...state.messages, message],
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, updatedAt: message.createdAt }
              : c,
          ),
        }))
      },

      sendReply: (conversationId, body, type = "reply") => {
        const currentUser = get().currentUser
        if (!currentUser) return
        get().sendMessage(conversationId, {
          type,
          authorId: currentUser.id,
          authorType: "agent",
          body,
          to: [],
        })
      },

      createConversation: (data) => {
        const currentUser = get().currentUser
        const conversation: Conversation = {
          id: id("conv"),
          number: get().conversations.length + 1001,
          subject: data.subject,
          mailboxId: data.mailboxId,
          customerId: data.customerId,
          assigneeId:
            data.assigneeId ||
            (currentUser ? [currentUser.id] : undefined)?.[0],
          status: data.status || "open",
          priority: data.priority || "medium",
          folder: data.folder || "inbox",
          starred: data.starred || false,
          labels: data.labels || [],
          tags: data.tags || [],
          followers: data.followers || [],
          source: data.source || "manual",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          readBy: currentUser ? [currentUser.id] : [],
          collision: [],
        }
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        }))
        if (data.body) {
          get().sendMessage(conversation.id, {
            type: "customer",
            authorId: data.customerId,
            authorType: "customer",
            body: data.body,
            to: [
              get().mailboxes.find((m) => m.id === data.mailboxId)?.email || "",
            ],
          })
        }
        return conversation
      },

      setComposeOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, composeOpen: open } })),

      addContact: (data) => {
        const contact: Contact = {
          id: id("c"),
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          notes: data.notes || [],
          customFields: data.customFields || {},
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ contacts: [...state.contacts, contact] }))
        return contact
      },

      addNote: (contactId, body, authorId) => {
        const note: Note = {
          id: id("note"),
          authorId,
          body,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          contacts: state.contacts.map((c) =>
            c.id === contactId ? { ...c, notes: [...c.notes, note] } : c,
          ),
        }))
      },

      updateSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),

      addMailbox: (data) => {
        const mailbox: Mailbox = {
          id: id("mb"),
          name: data.name,
          email: data.email,
          color: data.color || "#2896E8",
          userIds: data.userIds || [],
          autoReply: data.autoReply,
          signature: data.signature,
        }
        set((state) => ({ mailboxes: [...state.mailboxes, mailbox] }))
        return mailbox
      },

      createTag: (name, color) => {
        const tag: Tag = { id: id("t"), name, color }
        set((state) => ({ tags: [...state.tags, tag] }))
        return tag
      },

      addSavedReply: (data) => {
        const reply: SavedReply = {
          id: id("sr"),
          name: data.name,
          subject: data.subject || "",
          body: data.body,
          mailboxId: data.mailboxId,
        }
        set((state) => ({ savedReplies: [...state.savedReplies, reply] }))
        return reply
      },

      addUser: (data) => {
        const user: User = {
          id: id("u"),
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar,
          timezone: data.timezone || "UTC",
          status: "active",
          permissions: data.permissions || [],
          initials: getInitials(data.name),
        }
        set((state) => ({ users: [...state.users, user] }))
        return user
      },

      addWorkflow: (data) => {
        const workflow: Workflow = {
          id: id("wf"),
          name: data.name,
          active: data.active ?? true,
          conditions: data.conditions,
          actions: data.actions,
        }
        set((state) => ({ workflows: [...state.workflows, workflow] }))
        return workflow
      },

      addArticle: (data) => {
        const slug = data.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "")
        const article: KnowledgeBaseArticle = {
          id: id("kb"),
          title: data.title,
          slug,
          category: data.category,
          body: data.body,
          published: data.published ?? true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ articles: [...state.articles, article] }))
        return article
      },

      addNotification: (title, body) => {
        const currentUser = get().currentUser
        const notification: Notification = {
          id: id("notif"),
          userId: currentUser?.id || "unknown",
          title,
          body,
          read: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({
          notifications: [notification, ...state.notifications],
        }))
      },

      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),
    }),
    {
      name: "custom-webmail-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        users: state.users,
        mailboxes: state.mailboxes,
        contacts: state.contacts,
        conversations: state.conversations,
        messages: state.messages,
        tags: state.tags,
        savedReplies: state.savedReplies,
        workflows: state.workflows,
        articles: state.articles,
        settings: state.settings,
      }),
    },
  ),
)
