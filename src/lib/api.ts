import type {
  Conversation,
  Contact,
  Mailbox,
  Message,
  User,
  Tag,
  SavedReply,
  Workflow,
  KnowledgeBaseArticle,
} from "../types";

export interface ApiConversation {
  id: string;
  number: number;
  subject: string;
  mailboxId: string;
  contactId: string;
  assigneeId?: string;
  status: string;
  priority: string;
  folder: string;
  source: string;
  snoozeUntil?: string;
  readBy: string[];
  collision: string[];
  createdAt: string;
  updatedAt: string;
  mailbox: ApiMailbox;
  contact: ApiContact;
  assignee?: ApiUser | null;
  labels: ApiConversationLabel[];
  tags: ApiConversationTag[];
  followers: ApiFollower[];
  messages?: ApiMessage[];
}

export interface ApiMessage {
  id: string;
  conversationId: string;
  type: string;
  authorId?: string | null;
  authorType: string;
  body: string;
  bodyText?: string;
  to: string[];
  cc: string[];
  bcc: string[];
  createdAt: string;
  editedAt?: string;
  author?: ApiUser | null;
  attachments: ApiAttachment[];
}

export interface ApiAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: string;
  timezone?: string;
  status?: string;
  avatar?: string;
  createdAt?: string;
}

export interface ApiContactNote {
  id: string;
  contactId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ApiContact {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  notes?: ApiContactNote[];
  createdAt: string;
  updatedAt?: string;
  customFieldValues?: ApiCustomFieldValue[];
  conversations?: any[];
}

export interface ApiMailbox {
  id: string;
  name: string;
  email: string;
  color: string;
  imapHost?: string;
  imapPort?: number;
  imapSecure?: boolean;
  imapUser?: string;
  imapPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  lastFetchAt?: string;
  createdAt?: string;
}

export interface ApiConversationLabel {
  label: ApiTag;
}

export interface ApiConversationTag {
  tag: ApiTag;
}

export interface ApiTag {
  id: string;
  name: string;
  color: string;
}

export interface ApiFollower {
  userId: string;
}

export interface ApiCustomFieldValue {
  customField: ApiCustomField;
  value: string;
}

export interface ApiCustomField {
  name: string;
}

export interface ApiConversationList {
  items: ApiConversation[];
  count: number;
}

export interface ApiMessageInput {
  conversationId: string;
  type: string;
  body: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
}

export interface ApiChatRoomInput {
  name: string;
  userIds: string[];
  direct?: boolean;
}

export interface ApiBrand {
  id: string;
  companyName?: string | null;
  primaryColor?: string | null;
  logoS3Key?: string | null;
  faviconS3Key?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  darkModeDefault?: boolean;
  modules?: Record<string, boolean> | null;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function toUser(u: ApiUser): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as any,
    avatar: u.avatar,
    timezone: u.timezone || "UTC",
    status: (u.status || "active") as any,
    permissions: [],
    initials: getInitials(u.name),
  };
}

export function toMailbox(m: ApiMailbox): Mailbox {
  return {
    id: m.id,
    name: m.name,
    email: m.email,
    color: m.color,
    userIds: [],
    autoReply: "",
    signature: "",
  };
}

export function toContact(c: ApiContact): Contact {
  const customFields: Record<string, string> = {};
  c.customFieldValues?.forEach((fv) => {
    customFields[fv.customField.name] = fv.value;
  });
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    company: c.company,
    phone: c.phone,
    createdAt: c.createdAt,
    customFields,
    notes: (c.notes || []).map((n) => ({
      id: n.id,
      authorId: n.authorId,
      body: n.body,
      createdAt: n.createdAt,
    })),
  };
}

export function toMessage(
  m: ApiMessage,
  conversation?: ApiConversation,
): Message {
  let authorId = m.authorId || m.author?.id || "";
  let authorType = m.authorType as any;
  if (!authorId && conversation?.contactId && authorType === "customer") {
    authorId = conversation.contactId;
  }
  const typeMap: Record<string, Message["type"]> = {
    customer: "customer",
    reply: "reply",
    note: "internal",
    system: "system",
    forward: "reply",
    internal: "internal",
  };
  return {
    id: m.id,
    conversationId: m.conversationId,
    type: typeMap[m.type] || (m.type as any),
    authorId,
    authorType,
    body: m.body,
    bodyText:
      m.bodyText ||
      m.body
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    to: m.to || [],
    cc: m.cc || [],
    bcc: m.bcc || [],
    attachments: (m.attachments || []).map((a) => ({
      id: a.id,
      name: a.name,
      size: a.size,
      type: a.type,
      url: a.url,
    })),
    createdAt: m.createdAt,
    editedAt: m.editedAt,
  };
}

export function toConversation(c: ApiConversation): Conversation {
  const starred = c.folder === "starred";
  const labels = c.labels.map((l) => l.label.name);
  const tags = c.tags.map((t) => t.tag.name);
  return {
    id: c.id,
    number: c.number,
    subject: c.subject,
    mailboxId: c.mailboxId,
    customerId: c.contactId,
    assigneeId: c.assigneeId,
    status: c.status as any,
    priority: c.priority as any,
    folder: c.folder as any,
    starred,
    labels,
    tags,
    followers: c.followers?.map((f) => f.userId) || [],
    snoozeUntil: c.snoozeUntil,
    source: c.source as any,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    readBy: [...new Set(c.readBy || [])],
    collision: c.collision || [],
  };
}

async function fetchJson(input: string, init?: RequestInit) {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string>) || {}),
    },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path: string) => fetchJson(`/api${path}`),
  post: (path: string, data?: any) =>
    fetchJson(`/api${path}`, { method: "POST", body: JSON.stringify(data) }),
  patch: (path: string, data?: any) =>
    fetchJson(`/api${path}`, { method: "PATCH", body: JSON.stringify(data) }),
  del: (path: string) => fetchJson(`/api${path}`, { method: "DELETE" }),

  async login(email: string, password: string) {
    const data = await this.post("/auth/login", { email, password });
    return data.user;
  },

  async me() {
    return this.get("/auth/me");
  },

  async updateMe(data: Partial<ApiUser>) {
    return this.patch("/auth/me", data);
  },

  async changePassword(currentPassword: string, newPassword: string) {
    return this.post("/auth/change-password", { currentPassword, newPassword });
  },

  async logout() {
    return this.post("/auth/logout");
  },

  async listUsers() {
    const data = await this.get("/users");
    return (data as ApiUser[]).map(toUser);
  },

  async listMailboxes() {
    const data = await this.get("/mailboxes");
    return (data as ApiMailbox[]).map(toMailbox);
  },

  async createMailbox(data: Partial<Mailbox & ApiMailbox>) {
    return toMailbox(await this.post("/mailboxes", data));
  },

  async listContacts(search?: string) {
    const data = await this.get(
      `/contacts?search=${encodeURIComponent(search || "")}`,
    );
    return (data as ApiContact[]).map(toContact);
  },

  async createContact(data: Partial<Contact>) {
    return toContact(await this.post("/contacts", data));
  },

  async listConversations(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const data: ApiConversationList = await this.get(`/conversations${qs}`);
    return {
      items: data.items.map(toConversation),
      messages: data.items.flatMap((c) =>
        (c.messages || []).map((m) => toMessage(m, c)),
      ),
      count: data.count,
    };
  },

  async getConversation(id: string) {
    const c: ApiConversation = await this.get(`/conversations/${id}`);
    return {
      conversation: toConversation(c),
      messages: (c.messages || []).map((m) => toMessage(m, c)),
    };
  },

  async createConversation(data: any) {
    const c: ApiConversation = await this.post("/conversations", data);
    return {
      conversation: toConversation(c),
      messages: (c.messages || []).map((m) => toMessage(m, c)),
    };
  },

  async updateConversation(id: string, data: Partial<Conversation>) {
    const c: ApiConversation = await this.patch(`/conversations/${id}`, data);
    return {
      conversation: toConversation(c),
      messages: (c.messages || []).map((m) => toMessage(m, c)),
    };
  },

  async starConversation(id: string) {
    return this.post(`/conversations/${id}/star`);
  },

  async snoozeConversation(id: string, until: string) {
    return this.post(`/conversations/${id}/snooze`, { until });
  },

  async sendMessage(data: ApiMessageInput) {
    const m: ApiMessage = await this.post("/messages", data);
    return toMessage(m);
  },

  async getUploadUrl(filename: string, contentType: string) {
    return this.post("/attachments/upload-url", { filename, contentType });
  },

  async getBrand() {
    return this.get("/brand") as Promise<ApiBrand>;
  },

  async updateBrand(data: Partial<ApiBrand>) {
    return this.patch("/brand", data) as Promise<ApiBrand>;
  },

  async listChatRooms() {
    return this.get("/chat/rooms");
  },

  async createChatRoom(data: ApiChatRoomInput) {
    return this.post("/chat/rooms", data);
  },

  async listChatMessages(roomId: string) {
    return this.get(`/chat/rooms/${roomId}/messages`);
  },

  async createVideoRoom(name?: string) {
    return this.post("/video/rooms", { name });
  },

  async getVideoRoom(id: string) {
    return this.get(`/video/rooms/${id}`);
  },

  async getTurnCredentials() {
    return this.get("/video/turn");
  },

  async listTags() {
    return this.get("/tags") as Promise<ApiTag[]>;
  },

  async createTag(name: string, color: string) {
    return this.post("/tags", { name, color }) as Promise<ApiTag>;
  },

  async deleteTag(id: string) {
    return this.del(`/tags/${id}`);
  },

  async listSavedReplies() {
    return this.get("/saved-replies") as Promise<SavedReply[]>;
  },

  async createSavedReply(data: Partial<SavedReply>) {
    return this.post("/saved-replies", data) as Promise<SavedReply>;
  },

  async listWorkflows() {
    return this.get("/workflows") as Promise<Workflow[]>;
  },

  async createWorkflow(data: Partial<Workflow>) {
    return this.post("/workflows", data) as Promise<Workflow>;
  },

  async listArticles() {
    return this.get("/articles") as Promise<KnowledgeBaseArticle[]>;
  },

  async createArticle(data: Partial<KnowledgeBaseArticle>) {
    return this.post("/articles", data) as Promise<KnowledgeBaseArticle>;
  },

  async createUser(data: Partial<User> & { password?: string }) {
    return toUser(await this.post("/users", data));
  },

  async listContactNotes(contactId: string) {
    return this.get(`/contacts/${contactId}/notes`) as Promise<
      ApiContactNote[]
    >;
  },

  async createContactNote(contactId: string, body: string, authorId: string) {
    return this.post(`/contacts/${contactId}/notes`, { body, authorId });
  },

  async addTagToConversation(conversationId: string, tagId: string) {
    return this.post(`/conversations/${conversationId}/tags`, { tagId });
  },

  async removeTagFromConversation(conversationId: string, tagId: string) {
    return this.del(`/conversations/${conversationId}/tags/${tagId}`);
  },

  async listVideoRooms() {
    return this.get("/video/rooms");
  },

  async joinVideoRoom(id: string) {
    return this.post(`/video/rooms/${id}/join`, {});
  },

  // Portal (public, no auth)
  async listPublicArticles() {
    return this.get("/portal/articles") as Promise<KnowledgeBaseArticle[]>;
  },

  async submitPortalTicket(data: {
    mailboxId?: string;
    name: string;
    email: string;
    subject: string;
    body: string;
  }) {
    return this.post("/portal/tickets", data) as Promise<{
      number: number;
      id: string;
    }>;
  },

  async getPortalTicket(number: number, email: string) {
    return this.get(
      `/portal/tickets/${number}?email=${encodeURIComponent(email)}`,
    );
  },

  // App settings
  async getSettings() {
    return this.get("/settings");
  },

  async updateSettings(data: Record<string, any>) {
    return this.patch("/settings", data);
  },

  // Conversation follow/unfollow
  async followConversation(id: string) {
    return this.post(`/conversations/${id}/follow`);
  },

  async unfollowConversation(id: string) {
    return this.post(`/conversations/${id}/unfollow`);
  },

  // Mailbox update (for IMAP/SMTP settings)
  async updateMailbox(id: string, data: Partial<ApiMailbox>) {
    const m: ApiMailbox = await this.patch(`/mailboxes/${id}`, data);
    return toMailbox(m);
  },

  // Local attachment upload (handles local fallback)
  async uploadAttachment(file: File): Promise<{ name: string; url: string }> {
    const { uploadUrl, url, local } = await this.getUploadUrl(
      file.name,
      file.type || "application/octet-stream",
    );
    if (local) {
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        credentials: "include",
      });
    } else {
      await fetch(uploadUrl, { method: "PUT", body: file });
    }
    return { name: file.name, url };
  },
};
