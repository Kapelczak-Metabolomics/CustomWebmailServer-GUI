# CustomWebmailServer-GUI — FreeScout "MegaPlan" Build Plan

## 1. Goal

Transform the existing Figma-generated React/Vite/Tailwind webmail prototype into a **functional, FreeScout-style helpdesk / shared-inbox application** and commit the work to a new branch named `functional-application`.

> **Definition of "MegaPlan" used in this plan:** FreeScout core helpdesk functionality plus the complete set of official FreeScout modules (see [Modules list](#free-scout-modules)).

Because FreeScout itself is a mature PHP/Laravel application with dozens of modules and real email/IM integrations, the work is staged. **Phase 1 (this branch)** will deliver a fully functional **frontend application** that behaves like FreeScout: shared inboxes, conversations, tickets, users, assignments, labels/tags, saved replies, search/filters, reporting views, knowledge base, end-user portal, and UI shells for all modules. Real email fetching/sending and third-party channel integrations are architected but land in later backend phases.

## 2. Current State

- **Stack:** React 19, Vite 8, TypeScript 5.7, Tailwind CSS v4, pnpm.
- **Design tokens:** Dark/light theme objects (`DARK` / `LIGHT`) with Isotopiq-brand colors (`#2896E8` accent), already used in `src/App.tsx`.
- **Existing UI:** Login page, sidebar, message list, reading pane, compose modal, mock emails.
- **Repo conventions:** `AGENTS.md` / `CLAUDE.md` require default exports, Tailwind utility classes, no extra config files for Tailwind, apostrophe handling in strings.

## 3. Proposed Architecture

```
CustomWebmailServer-GUI
├── src
│   ├── main.tsx                # entry point
│   ├── index.css               # Tailwind + design-token CSS variables
│   ├── App.tsx                 # router + top-level providers
│   ├── theme.ts                # DARK/LIGHT token objects + ThemeProvider
│   ├── stores/                 # app state (React Context + reducer or Zustand)
│   ├── types/                  # shared TS interfaces
│   ├── components/             # reusable UI (Button, Input, Modal, Avatar, Badge, etc.)
│   ├── layouts/                # AppLayout, AuthLayout
│   ├── pages/                  # route-level pages
│   │   ├── LoginPage.tsx
│   │   ├── InboxPage.tsx
│   │   ├── ConversationPage.tsx
│   │   ├── ContactsPage.tsx
│   │   ├── ReportsPage.tsx
│   │   ├── KnowledgeBasePage.tsx
│   │   ├── EndUserPortalPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── AdminPage.tsx
│   ├── hooks/                  # useLocalStorage, useAuth, useConversations, etc.
│   └── lib/                    # utilities, mock data generators, validators
├── public/                     # static assets
└── (future) server/            # FastAPI/Node backend, DB migrations, worker queues
```

### State strategy (Phase 1)

- Use **React Context + `useReducer`** or a small **Zustand** store (only if added to `package.json`) for global state.
- Persist data to `localStorage` so the app is functional without a backend.
- Keep mock data generators for demos.
- Structure state around the data model below.

### Routing

- Add `react-router-dom`.
- Routes:
  - `/login`
  - `/` → dashboard
  - `/inbox` and `/inbox/:folder`
  - `/conversation/:id`
  - `/contacts`, `/contacts/:id`
  - `/reports`
  - `/knowledge-base`
  - `/portal` (end-user view)
  - `/settings/:tab`
  - `/admin/:tab`

## 4. Design System Extension

1. **Move theme tokens into CSS variables** in `index.css` so components can use `var(--...)` or Tailwind utility classes.
2. **Create reusable primitives:** `Button`, `IconButton`, `Input`, `Select`, `Badge`, `Avatar`, `Modal`, `Drawer`, `Dropdown`, `Tabs`, `Toggle`, `Skeleton`.
3. **Keep the existing visual language:** dark sidebar, rounded cards, blue accent (`#2896E8`), subtle borders, pill filters, hover transitions.
4. **Extend existing icons** from the inline `Icon` object into a shared `Icons` component or SVG sprite.

## 5. Data Model

```ts
// User / Agent
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'agent' | 'customer'
  avatar?: string
  timezone: string
  status: 'active' | 'away' | 'offline'
  permissions: string[]
}

// Mailbox = shared inbox / support address
interface Mailbox {
  id: string
  name: string
  email: string
  color: string
  users: string[]
  autoReply?: string
  signature?: string
}

// Customer / Contact
interface Contact {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  notes: Note[]
  customFields: Record<string, string>
  createdAt: string
}

// Conversation = ticket thread
interface Conversation {
  id: string
  number: number          // ticket number module
  subject: string
  mailboxId: string
  customerId: string
  assigneeId?: string
  status: 'open' | 'pending' | 'closed' | 'spam'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  folder: 'inbox' | 'starred' | 'sent' | 'drafts' | 'archive' | 'spam' | 'trash'
  starred: boolean
  labels: string[]
  tags: string[]          // free-scout tags
  followers: string[]     // followers module
  snoozeUntil?: string    // snooze module
  source: 'email' | 'chat' | 'portal' | 'api' | 'manual'
  createdAt: string
  updatedAt: string
  lastUserReplyAt?: string
  lastCustomerReplyAt?: string
  readBy: string[]        // read receipts
  collision?: string[]    // who else is viewing
}

// Message / Thread entry
interface Message {
  id: string
  conversationId: string
  type: 'customer' | 'reply' | 'internal' | 'system' | 'note'
  authorId: string
  authorType: 'agent' | 'customer' | 'system'
  body: string            // HTML or markdown
  bodyText: string
  to: string[]
  cc: string[]
  bcc: string[]
  attachments: Attachment[]
  createdAt: string
  editedAt?: string       // edit threads module
  openTracking?: boolean  // open tracking module
}

interface Attachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

interface Note {
  id: string
  authorId: string
  body: string
  createdAt: string
}

interface SavedReply {
  id: string
  name: string
  subject: string
  body: string
  mailboxId?: string
}

interface Workflow {
  id: string
  name: string
  active: boolean
  conditions: Condition[]
  actions: Action[]
}

interface ReportSnapshot {
  period: string
  conversations: number
  replies: number
  firstResponseTime: number
  resolutionTime: number
  satisfaction: number
  byAgent: Record<string, AgentMetrics>
}
```

## 6. Feature Backlog / FreeScout Modules

### Core (Phase 1)

- Shared mailboxes & conversation list
- Reading pane with threaded replies
- Compose / reply / forward / internal notes
- Star, archive, delete, spam, mark unread
- Assign conversations to agents
- Status + priority
- Labels/tags with colors
- Search + filters (folder, status, assignee, label, date)
- Saved replies / canned responses
- User roles & permissions
- Notifications (in-app toast + badge counts)
- Collision detection UI ("Agent X is viewing")
- Keyboard shortcuts
- Dark/light mode
- Mobile-responsive layout

### FreeScout Modules (UI + state, integrations later)

| Module | In-App Surface |
|--------|----------------|
| API & Webhooks | Settings → API keys / webhook endpoints |
| Auto Login | Settings → authentication |
| Block External Images | Settings → security / reading pane option |
| Chat | Chat widget page + conversation source |
| Checklists | Conversation checklist UI |
| CRM | Contacts page with company/notes |
| Custom Fields | Contact, conversation, user custom fields |
| Custom Folders | Saved search folders in sidebar |
| Custom Homepage | Dashboard widgets |
| Custom Signatures | Per-mailbox signatures in compose |
| Customer Data Enrichment | Contact profile enrichment placeholders |
| Customization | Branding, CSS, white-label settings |
| Dark Mode | Already present; extend to all pages |
| eBay / Shopify / WooCommerce | Integration settings cards |
| Email Commands | Help overlay for email command syntax |
| Embed Images | Compose image embedding |
| End-User Portal | Separate `/portal` routes |
| Export Conversations | Reports → export buttons |
| Extended Attachments | Attachment list + preview |
| Extended Editor | Rich text toolbar |
| Extra Security | 2FA / security settings |
| Facebook / Telegram / Twitter / WhatsApp | Channel settings + source badges |
| Faster Search | Debounced full-text search |
| Followers | Follow/unfollow UI |
| GDPR | Data export / delete requests |
| Global Mailbox | Cross-mailbox unified inbox |
| IMAP Move | Mailbox sync settings (future backend) |
| Inbox | Main inbox view (core) |
| Jira | Issue linking in conversation |
| Kanban | Board view of conversations |
| Keyboard Shortcuts | Help modal |
| Knowledge Base | `/knowledge-base` articles |
| LDAP / SAML / OAuth | Auth settings |
| Mail Signing | DKIM / signing settings |
| Mailbox Icons | Color/icon picker per mailbox |
| Mentions | `@agent` in internal notes |
| Mobile Notifications | Notification settings |
| NoReply | Noreply handling |
| Office Hours | Business hours / auto-reply schedule |
| Out of Office | Agent out-of-office banner |
| Reports | Reports page with charts |
| Rocket.Chat / Slack | Channel settings + message source |
| SMS Notifications / SMS Tickets | SMS channel settings |
| Snooze | Snooze date picker |
| Spam Filter | Spam rules settings |
| Sticky Notes | Conversation sticky notes |
| Tags | Tag management |
| Teams | Team/group settings |
| Ticket Number | Display `#12345` ticket numbers |
| Ticket Translator | Translation options (placeholder UI) |
| Time Tracking | Time spent input per reply |
| Two-Factor Authentication | 2FA settings |
| User Fields | Custom fields on user profiles |
| Wallboards | Full-screen dashboard |
| White Label | Branding settings |
| Workflows | Visual workflow builder (simple) |

## 7. Implementation Phases

### Phase 0 — Plan & Foundation (this branch)

- Create `functional-application` branch.
- Install `react-router-dom` (and optionally `zustand`, `date-fns`, `recharts`).
- Split theme tokens into CSS variables + `theme.ts`.
- Set up folder structure (`components`, `pages`, `stores`, `hooks`, `lib`, `types`).
- Move existing `App.tsx` components into separate files while preserving default exports.
- Add a small auth context (demo login with any email + `password`).

### Phase 1 — Core Helpdesk (this session)

- Build `AppLayout` with collapsible sidebar, global search, notifications bell, and user menu.
- Refactor mailbox + conversation views to use the new data model.
- Implement conversation detail with threaded messages, reply/forward/note, attachments, labels, assignee, status, priority.
- Add contacts/CRM page.
- Add settings page (general, mailboxes, users/teams, labels/tags, saved replies, personal).
- Add simple reports page with key metrics.
- Add knowledge base page with articles list and viewer.
- Add end-user portal pages (ticket list, submit ticket, view ticket).
- Add localStorage persistence and mock data generators.
- Add keyboard shortcuts, dark mode, and mobile responsive layout.

### Phase 2 — Backend & Real Channels (future)

- Add FastAPI/Node backend, PostgreSQL, Redis.
- Implement IMAP/SMTP fetching and sending workers.
- Add real-time updates via WebSockets/SSE.
- Add user auth (JWT, OAuth, SAML, LDAP).
- Add API + webhooks module.

### Phase 3 — Modules & Integrations (future)

- Implement channel integrations (WhatsApp, Telegram, Slack, Facebook, etc.) using their APIs/webhooks.
- Implement workflows, time tracking, wallboards, ticket translator, advanced reports.
- Add mobile push notifications.

### Phase 4 — Polish & Deploy

- Add E2E tests (Playwright), unit tests (Vitest).
- Add CI/CD, Docker, deployment to Fly/Railway/self-host.
- Accessibility audit and performance optimization.

## 8. Build / Test / Deploy

- `pnpm install`
- `pnpm run dev` — Vite dev server on port 8443 (or `$PORT`)
- `pnpm run build` — production build
- `pnpm run preview` — preview production build
- `pnpm run format` — format with `oxfmt`
- Run TypeScript checks: `npx tsc --noEmit` (add to scripts if needed)
- End-to-end smoke test through browser preview after each major page.

## 9. Branch & PR

- Work in `functional-application`.
- PR title: `feat: functional FreeScout-style helpdesk application`
- PR body: summary of Phase 1 features, screenshots, known limitations (backend integrations out of scope), and Phase 2/3 roadmap.

## 10. Open Questions

1. Does "MegaPlan" for you mean the full module set above, or a specific subset (e.g., only the most commonly used modules)?
2. Should this branch include a real backend, or is a functional frontend prototype with localStorage acceptable for now?
3. Are there any custom features or integrations (e.g., Isotopiq branding, specific SSO provider) that should take priority?
