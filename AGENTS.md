# figma-make-app

React + Vite + Tailwind CSS project running inside Figma Make.

## Development Server

A Vite development server is **already running** on `$PORT` (default 8443). You don't need to start it manually.

- Preview URL: The user can access the running app through the preview panel
- Hot reload: Changes to source files are reflected immediately

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/main.tsx` - React entrypoint; imports `src/index.css` and mounts `src/App.tsx` into the `#root` element
- `src/App.tsx` - Primary application component and the usual starting point for UI work
- `src/index.css` - Global CSS entrypoint and Tailwind CSS v4 import
- `index.html` - Vite HTML shell containing the `#root` element and loading `src/main.tsx`
- `package.json` - Project dependencies and the Vite build, development, preview, and formatting scripts
- `vite.config.ts` - Vite configuration with React, Tailwind CSS v4, and Figma Make plugins plus the `@` alias for `src`
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Runtime: React 19 and React DOM 19
- Styling: Tailwind CSS v4 with the `@tailwindcss/vite` plugin
- Build tooling: Vite 8, TypeScript 5.7, and `@vitejs/plugin-react`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/vite` plugin configured in `vite.config.ts`. `src/index.css` imports Tailwind with `@import 'tailwindcss';`. Use Tailwind utility classes directly in JSX and put global CSS or Tailwind v4 theme customization in `src/index.css`. This scaffold does not need a Tailwind config file or PostCSS config.

`src/main.tsx` imports `src/index.css`, so global font wiring belongs in `src/index.css`. Keep CSS `@import` statements first, then add any `@font-face` rules and font-family defaults there.

## Code quality

- Use double quotes for strings containing apostrophes (`"We're here to help"`), or escape them in single-quoted strings. An unescaped apostrophe in a single-quoted string breaks the build.
- Ensure JSX tags are closed and braces are balanced.
- Export components as default exports.

## Docker Deployment

The application runs entirely via Docker. All services (app, PostgreSQL, Redis, coturn, Mailpit) are defined in `docker-compose.yml`.

### Production (EasyPanel)

All services use unique ports (18xxx range) to avoid conflicts:

| Service    | Host Port | Container Port |
|------------|-----------|----------------|
| App        | 18300     | 3000           |
| Mailpit UI | 18025     | 18025          |
| Mailpit SMTP| 18125    | 18125          |
| coturn     | 18478     | 18478          |

```bash
# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f app
```

The app container serves both the API (on `/api/*`) and the built React frontend (on all other routes) from a single port (18300 on host, 3000 in container).

### Development

For local development with hot reload, use `docker-compose.dev.yml` which runs only the infrastructure services:

```bash
# Start infrastructure only
docker compose -f docker-compose.dev.yml up -d postgres redis coturn mailpit

# Run backend and frontend directly for hot reload
cd server && pnpm dev
pnpm dev
```

### Environment Variables

See `.env.example` for all configurable variables. Key ones:

- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_SECRET` — JWT signing secret (auto-generated if not set)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — Initial admin credentials
- `MAILPIT_HOST` — Set to `mailpit` in Docker, `localhost` for local dev
- `S3_ENDPOINT` — Leave empty to use local filesystem attachment storage
- `TURN_SECRET` — Shared secret for coturn TURN server

### Volumes

- `pgdata` — PostgreSQL data
- `appdata` — App secrets (JWT, admin password)
- `uploads` — Local attachment storage (when S3 is not configured)

## Feature Set

The application implements a FreeScout-style email/helpdesk platform with:

### Core Features
- **Mailboxes** — Shared inboxes with IMAP/SMTP configuration, CRUD operations
- **Conversations** — Threaded messages with replies, internal notes, forwarding, attachments
- **Status/Priority/Assignment** — Open/pending/closed/spam, priority levels, agent assignment
- **Tags & Labels** — Color-coded tagging system with CRUD
- **Folders & Snoozing** — Inbox, assigned, snoozed, trash; snooze with date
- **Starring & Following** — Star conversations, follow for updates
- **Contacts & CRM** — Contact management with notes (CRUD), custom fields
- **Saved Replies** — Reusable reply templates with CRUD
- **Workflows** — Automated workflow rules (admin-managed)
- **Search & Filtering** — Full-text search, status/priority/mailbox filters
- **Reports** — Ticket metrics by status/priority/mailbox, calculated avg resolution time
- **Knowledge Base** — Published articles with public portal access
- **Public Portal** — End-user ticket submission, ticket lookup, satisfaction ratings
- **Admin/Settings** — User management, mailbox config, module toggles, brand customization
- **Team Chat** — Direct messages, group chats, read receipts (per-user toggle, admin force)
- **Video Meetings** — WebRTC video rooms with TURN, create/delete/leave, signaling

### Advanced Models
- **Teams** — Team creation with member management (admin)
- **Custom Fields** — Configurable fields (text/number/date/select) for contacts
- **Checklists** — Per-conversation checklists with items, progress tracking
- **Time Tracking** — Log time on conversations, total time, entry management
- **Satisfaction Ratings** — 1-5 star ratings with comments, portal submission

### Security
- **XSS Protection** — All HTML rendered through DOMPurify sanitizer
- **Password Reset** — Forgot-password flow with email reset links
- **Authorization** — Role-based access (admin/agent/customer), ownership checks
- **Cookie Security** — HttpOnly, SameSite cookies; secure cookie parsing utility

### UI/UX
- **Toast Notifications** — Replaces browser alerts for user feedback
- **Dark/Light Theme** — Full theme system with tokens
- **Responsive Design** — Split-screen login, adaptive layouts
- **Accessibility** — Focus-visible states, reduced-motion support, ARIA labels
- **Animations** — Fade-in, scale-in, slide-in, hover-lift, skeleton shimmer

### API Endpoints
- Auth: login, logout, register, me, change-password, forgot-password, reset-password
- CRUD: conversations, messages, mailboxes, contacts, tags, users, saved replies, workflows, articles
- Advanced: teams, checklists, time tracking, satisfaction ratings, custom fields
- Realtime: Socket.IO for chat, video signaling, receipt updates
- Portal: public articles, ticket submission, ticket lookup, satisfaction ratings
