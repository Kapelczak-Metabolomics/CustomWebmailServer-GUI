export type Theme = "dark" | "light";

export type Role = "admin" | "agent" | "customer";

export type ConversationStatus = "open" | "pending" | "closed" | "spam";
export type Priority = "low" | "medium" | "high" | "urgent";
export type Folder =
  "inbox" | "starred" | "sent" | "drafts" | "archive" | "spam" | "trash";
export type MessageType = "customer" | "reply" | "internal" | "system" | "note";
export type MessageSource = "email" | "chat" | "portal" | "api" | "manual";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  timezone: string;
  status: "active" | "away" | "offline";
  permissions: string[];
  initials: string;
}

export interface Mailbox {
  id: string;
  name: string;
  email: string;
  color: string;
  userIds: string[];
  autoReply?: string;
  signature?: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  notes: Note[];
  customFields: Record<string, string>;
  createdAt: string;
}

export interface Note {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface Message {
  id: string;
  conversationId: string;
  type: MessageType;
  authorId: string;
  authorType: "agent" | "customer" | "system";
  body: string;
  bodyText: string;
  to: string[];
  cc: string[];
  bcc: string[];
  attachments: Attachment[];
  createdAt: string;
  editedAt?: string;
}

export interface Conversation {
  id: string;
  number: number;
  subject: string;
  mailboxId: string;
  customerId: string;
  assigneeId?: string;
  status: ConversationStatus;
  priority: Priority;
  folder: Folder;
  starred: boolean;
  labels: string[];
  tags: string[];
  followers: string[];
  snoozeUntil?: string;
  source: MessageSource;
  createdAt: string;
  updatedAt: string;
  readBy: string[];
  collision: string[];
}

export interface SavedReply {
  id: string;
  name: string;
  subject: string;
  body: string;
  mailboxId?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  conditions: string;
  actions: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  body: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface AppSettings {
  companyName: string;
  defaultMailboxId?: string;
  officeHours: string;
  autoReply: boolean;
  whiteLabel: boolean;
  forceReadReceipts: boolean;
  darkMode: boolean;
}

export interface AppState {
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
}
