# CustomWebmailServer-GUI — Phase 2 Plan

## Goal

Move the working Phase 1 frontend (FreeScout-style helpdesk UI with localStorage) to a full-stack application with:

1. A real backend that fetches/sends email and persists data.
2. Internal staff live messenger chat inside the portal.
3. Brand customization.
4. S3-compatible attachment storage.
5. Video conference meetings with a bundled TURN/STUN server.
6. Functional parity for all helpdesk features surfaced in Phase 1.

> **Scope note:** Per your direction, we are **not** building Twilio, Slack, OAuth, Telegram, eBay, or Shopify integrations in this phase.

---

## 1. Architecture

```
CustomWebmailServer-GUI
├── client/                  (moved from current src/ frontend)
│   └── existing Vite + React + Tailwind app
├── server/                  (new Node/TypeScript backend)
│   ├── src/
│   │   ├── index.ts         # HTTP + Socket.IO entry
│   │   ├── routes/          # REST API
│   │   ├── services/        # IMAP fetcher, SMTP sender, S3, etc.
│   │   ├── workers/         # background job processors
│   │   ├── realtime/        # Socket.IO chat + WebRTC signaling
│   │   └── lib/             # db, redis, config
│   ├── prisma/schema.prisma # PostgreSQL schema
│   └── package.json
├── docker-compose.yml       # app, db, redis, coturn
├── Dockerfile.client
└── Dockerfile.server
```

### Stack

- **Frontend:** existing React 19 + Vite + Tailwind CSS v4 + Zustand (API-backed).
- **Backend:** Node 22 + Express + TypeScript + Prisma ORM.
- **Database:** PostgreSQL 16.
- **Cache / pub-sub / jobs:** Redis + BullMQ.
- **Email:** `imapflow` (IMAP IDLE/polling), `nodemailer` (SMTP).
- **File storage:** AWS SDK v3 for S3 (or MinIO-compatible endpoints).
- **Real-time chat:** Socket.IO.
- **Video conference:** WebRTC mesh (MVP) with bundled `coturn` for TURN/STUN. A mediasoup/LiveKit SFU upgrade is documented as Phase 2E follow-up.
- **Deployment:** Docker Compose, Easypanel-compatible.

---

## 2. Backend Foundation (Phase 2A)

### Database models (Prisma)

- `User` — id, email, name, role (admin/agent/customer), password hash, timezone, status, avatar, createdAt.
- `Mailbox` — name, email, color, imapHost, imapPort, imapUser, imapPassword, smtpHost, smtpPort, smtpUser, smtpPassword, lastFetchAt.
- `Contact` — name, email, company, phone, notes, custom fields.
- `Conversation` — subject, number, mailboxId, contactId, assigneeId, status, priority, folder, labels, tags, followers, snoozeUntil, source, createdAt, updatedAt.
- `Message` — conversationId, type (customer/reply/note/system/forward), authorId, authorType, body (HTML), bodyText, to/cc/bcc, createdAt.
- `Attachment` — messageId, name, size, type, s3Key, url.
- `SavedReply`, `Workflow`, `Article`, `Tag`, `Team`, `UserField`, `CustomField`, `BrandSettings`.
- `ChatRoom`, `ChatMessage`, `ChatRoomMember` for internal staff messenger.
- `VideoRoom` for conference metadata.

### API surface (REST)

- `/api/auth/login`, `/api/auth/me`, `/api/auth/logout` (JWT cookie).
- `/api/users`, `/api/teams`
- `/api/mailboxes`
- `/api/contacts`
- `/api/conversations` — list, filters, create, update, merge, forward, snooze, assign, status/priority.
- `/api/messages` — send reply, note, forward.
- `/api/attachments` — presigned upload URLs.
- `/api/saved-replies`, `/api/tags`, `/api/workflows`, `/api/articles`, `/api/reports`
- `/api/chat/rooms`, `/api/chat/rooms/:id/messages`
- `/api/brand` — public brand config.
- `/api/turn` — TURN/STUN credentials for WebRTC.

### Infrastructure code

- Middleware: auth, role guards, error handling, request logging.
- Prisma seed script with demo data.
- Background job queue (BullMQ) for IMAP fetch and outgoing mail.
- Healthcheck endpoint `/api/health` used by Docker/Easypanel.

---

## 3. Email IMAP / SMTP (Phase 2B)

### IMAP fetch worker

- Poll each mailbox every 30–60 seconds + optional IMAP IDLE for supported servers.
- Fetch unseen messages since `lastFetchAt`.
- Parse with `mailparser` or `simple-parser`.
- Deduplicate by `Message-Id`.
- Match sender to existing `Contact` or create one.
- Create `Conversation` and `Message` records; if thread exists by `In-Reply-To`/`References`, append to conversation.
- Move/remove fetched message if the `IMAP Move` module setting is enabled.
- Update `Mailbox.lastFetchAt`.

### SMTP sender

- Agent reply or new conversation triggers `nodemailer` using mailbox SMTP settings.
- Support HTML body, attachments from S3, `cc`/`bcc`.
- Store sent message record and update `Conversation.lastUserReplyAt`.
- Sent folder sync is out-of-scope unless trivial.

### Web UI changes

- Mailbox settings page: IMAP/SMTP host, port, TLS, credentials.
- Compose/reply now actually sends email via backend.
- "Send & Close", "Send Later", signatures, auto-reply rules.

---

## 4. Internal Staff Live Messenger Chat (Phase 2C)

### Backend

- Socket.IO namespace `/chat` authenticated with JWT.
- Models: `ChatRoom` (direct & group), `ChatRoomMember`, `ChatMessage`.
- Events: `join-room`, `leave-room`, `send-message`, `typing`, `read-receipt`.
- Persist all messages.
- Unread count per member, delivered/read receipts.

### Frontend

- New sidebar item "Team Chat" visible only to staff (admin/agent).
- Room list with unread badges, online/presence status.
- Message list with real-time updates, message input, file attachments.
- Link from a conversation to "Start team chat about this ticket" creating a room with context.

### Portal chat note

This is **internal staff only**, not the end-user live chat widget. The end-user portal can still submit tickets; a future customer live chat can reuse the same Socket.IO room model.

---

## 5. Brand Customization (Phase 2D)

### Backend

- `BrandSettings` table: `companyName`, `logoS3Key`, `faviconS3Key`, `primaryColor`, `darkModeDefault`, `customCss`, `portalTitle`.
- `/api/brand` public endpoint returns current brand config and signed logo URL.
- `/api/admin/brand` admin-only update endpoint.
- S3 upload endpoint for brand assets (see S3 section).

### Frontend

- On app load, fetch brand config and override CSS variables / theme tokens.
- Admin settings page: logo upload, color picker, portal title, custom CSS textarea.
- White-label: hide "Isotopiq" references when `companyName` is set.

---

## 6. S3-Compatible Attachment Storage (Phase 2D)

### Backend

- Environment variables:
  - `S3_ENDPOINT` (e.g. `https://s3.amazonaws.com` or MinIO endpoint)
  - `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
  - `S3_FORCE_PATH_STYLE=true` for MinIO
- `POST /api/attachments/upload` returns a presigned PUT URL.
- `GET /api/attachments/:id` redirects to a presigned GET URL or returns public URL.
- On message creation, store `s3Key` and generate `url`.

### Frontend

- Attachment drop zone in compose/reply.
- Direct upload to presigned S3 URL.
- Attachment preview/download in reading pane.

---

## 7. Video Conferencing + Bundled TURN/STUN (Phase 2E)

### Bundled TURN/STUN (`coturn`)

Add a `coturn` service to `docker-compose.yml` with generated shared secret:

```yaml
coturn:
  image: coturn/coturn:latest
  environment:
    TURN_MIN_PORT: 49160
    TURN_MAX_PORT: 49200
    TURN_SECRET: ${TURN_SECRET:?required}
    TURN_REALM: ${APP_HOST:-localhost}
  ports:
    - "3478:3478/udp"
    - "3478:3478/tcp"
    - "5349:5349/tcp"
    - "49160-49200:49160-49200/udp"
```

The backend `POST /api/turn` returns short-lived TURN credentials hashed with `TURN_SECRET`.

### WebRTC signaling (MVP — mesh)

- Socket.IO namespace `/video`.
- Events: `create-room`, `join-room`, `leave-room`, `offer`, `answer`, `ice-candidate`, `participant-joined`, `participant-left`, `mute-toggle`, `screen-share`.
- Rooms stored in Redis/DB (`VideoRoom`); max participants per room in config.
- Each participant creates a `RTCPeerConnection` to every other participant (mesh). This is the simplest implementation for small team meetings and works with the bundled coturn.

### Frontend

- "Start video meeting" button in Team Chat and conversation header.
- `/video/:roomId` route with local/remote video grid, mute, camera toggle, screen share, leave.
- Request camera/mic permissions and show device selection.

### SFU upgrade path

If mesh becomes a bottleneck, replace with a `mediasoup` or `livekit` service in a later PR. The Socket.IO signaling layer and `coturn` remain.

---

## 8. Functional Feature Parity (Phase 2F)

After the backend is in place, wire the frontend to real data/actions for every Phase 1 shell:

| Feature | Backend work | Frontend work |
|---------|--------------|---------------|
| Conversations / tickets | CRUD, filters, counters | Update Zustand to call API |
| Assign / status / priority / labels / tags | Update endpoints | Reading pane controls |
| Reply / note / forward / internal | Send mail, persist | Composer modes |
| Star / archive / spam / delete | Folder/status updates | Sidebar folder counts |
| Saved replies | CRUD | Insert into composer |
| Snooze | `snoozeUntil` field + filters | Snooze picker |
| Followers | many-to-many relation | Follow/unfollow button |
| Mentions | parse `@user` in notes | mention autocomplete |
| Checklists | checklist table per conversation | checklist UI in reading pane |
| Custom fields | `CustomField` + values | forms/renderers |
| Time tracking | time entries per message/reply | timer UI + reports |
| Workflows | rule engine on new messages | builder UI |
| Reports | aggregation queries | charts |
| Knowledge base | article CRUD | editor + viewer |
| End-user portal | public ticket submission, auth by email link | existing portal, connect APIs |
| Auto-reply / office hours / out-of-office | settings + mail worker | settings forms |
| Spam filter | simple rules + spam folder | spam actions |
| White-label | brand settings | apply brand tokens |
| Wallboards | real-time metrics endpoint | full-screen dashboard |
| Ticket number | sequential number per mailbox | display `#` prefix |

---

## 9. Frontend Refactor

- Move frontend source into a `client/` folder (or keep `src/` at root and add `server/`).
- Replace localStorage-backed Zustand with API calls.
- Keep optimistic UI updates and loading/error states.
- Update `App.tsx` protected routes to use API auth.
- Add `api.ts` client with axios/fetch and token refresh.
- Add Socket.IO hooks for chat and video.

---

## 10. Docker / Easypanel Deployment

### Services

- `client` — Vite-built static files served by `serve` or nginx.
- `server` — Node/Express API.
- `postgres` — PostgreSQL.
- `redis` — Redis for cache, BullMQ, Socket.IO adapter.
- `coturn` — TURN/STUN server.

### Environment variables

```
# App
NODE_ENV=production
APP_HOST=mail.example.com
PORT=3000
CLIENT_URL=https://mail.example.com

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/isotopiq_mail

# Redis
REDIS_URL=redis://redis:6379

# Auth
JWT_SECRET=...

# IMAP/SMTP for default mailbox (can be overridden per mailbox in UI)
# Optional — if not provided, admin configures in app

# S3
S3_ENDPOINT=...
S3_REGION=...
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=false

# TURN
TURN_SECRET=...
```

### Easypanel compatibility

- Provide top-level `docker-compose.yml` with `build` contexts.
- Add `Dockerfile.client` and `Dockerfile.server`.
- Healthchecks on `server` and `coturn`.
- Document port mapping (`client` on 80/3000, `server` on 3000, `coturn` on 3478).

---

## 11. Implementation Phases & Sessions

### Phase 2A — Backend foundation
- Scaffold `server/`, Prisma schema, migrations, auth, basic API.
- Docker Compose with postgres + redis.
- Update `docker-compose.yml` and add `Dockerfile.server`.

### Phase 2B — IMAP/SMTP email
- IMAP fetch worker, SMTP send, conversation/message creation.
- Mailbox settings UI.
- Compose/reply wired to backend.

### Phase 2C — Internal staff live chat
- Socket.IO chat backend + DB models.
- Team Chat UI in frontend.

### Phase 2D — S3 attachments + Brand customization
- Presigned S3 uploads, attachment UI.
- Brand settings backend/admin UI.

### Phase 2E — Video conferencing
- Add `coturn` service, TURN credentials endpoint.
- Socket.IO signaling, `/video/:roomId` page.

### Phase 2F — Feature parity sweep
- Wire remaining modules (snooze, follow, mentions, checklists, custom fields, workflows, etc.) to real backend.
- Reports, wallboards, KB editor, portal ticket view.

### Phase 2G — Testing & polish
- Unit tests (server: `vitest` or `jest`).
- E2E smoke tests with Playwright.
- Easypanel deploy test.
- Final PR review and merge.

---

## 12. Open Questions / Decisions Needed

1. **Folder layout:** Do you want the frontend moved to `client/` and backend in `server/`, or keep `src/` and add `server/`?
2. **Auth:** Email/password login is simplest. Should we still keep demo login emails and passwords for the seed?
3. **S3:** Will you provide S3 credentials, or should the compose file include a local `minio` container for development?
4. **Email provider:** For testing IMAP/SMTP, do you have a mailbox/server to test against, or should we bundle a test mail server (e.g. `mailhog`/`mailpit`)?
5. **Video architecture:** Are you OK with the WebRTC mesh + coturn MVP for small meetings, or do you want an SFU (mediasoup/LiveKit) from the start?
6. **Deployment target:** Easypanel on your own server, or a cloud provider (Fly/Railway/Render)?

---

## 13. Build / Test / Deploy Commands

```bash
# Dev
cd server && pnpm install && pnpm prisma migrate dev && pnpm dev
cd client && pnpm install && pnpm dev

# Production build
docker compose -f docker-compose.yml up --build -d

# Server lint/test
cd server && pnpm lint && pnpm test

# Client build
cd client && pnpm run build && pnpm run format
```
