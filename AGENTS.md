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

```bash
# Build and start all services
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f app
```

The app container serves both the API (on `/api/*`) and the built React frontend (on all other routes) from a single port (3000).

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
