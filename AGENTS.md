# AGENTS.md

## Cursor Cloud specific instructions

This is a React + Vite + TypeScript SPA ("TV Dashboard - Visual Factory") with Supabase as the backend.

### Services

| Service         | Command       | Port | Notes                                                     |
| --------------- | ------------- | ---- | --------------------------------------------------------- |
| Vite dev server | `npm run dev` | 3000 | Set `VITE_USE_HTTPS=false` in `.env` to avoid cert issues |

### Key commands

See `package.json` scripts. Summary:

- **Lint:** `npm run lint`
- **Typecheck:** `npm run typecheck`
- **Tests:** `npm run test:ci` (single run) or `npm test` (watch mode)
- **Dev server:** `npm run dev` (port 3000, accessible on LAN by default)
- **Build:** `npm run build`

### Environment variables

The app requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in a `.env` file at the repo root. Without valid Supabase credentials the app starts but shows a "Error de Conexión" modal on every route. Copy `.env.example` to `.env` and fill in real values, or use placeholders for UI-only development work.

Set `VITE_USE_HTTPS=false` in `.env` to disable HTTPS in development (no certs needed).

The `.env` file is not committed. When Cursor Cloud secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are injected as environment variables, write them to `.env` before starting the dev server:

```bash
printf 'VITE_SUPABASE_URL=%s\nVITE_SUPABASE_ANON_KEY=%s\nVITE_USE_HTTPS=false\n' "$VITE_SUPABASE_URL" "$VITE_SUPABASE_ANON_KEY" > .env
```

Vite reads `.env` at startup; changing it requires a dev server restart.

### Pre-existing issues (as of initial setup)

- `npm run typecheck` has one error in `src/components/SettingsPage.tsx` (TS2345).
- `npm run build` fails because `tailwind-merge` and `clsx` are referenced in `vite.config.ts` `manualChunks` but are not listed in `package.json` dependencies.
- `npm run test:ci` has 26 pre-existing test failures out of 122 tests (96 pass).

### Git hooks

Husky + lint-staged runs on pre-commit: ESLint on `*.{ts,tsx}` and Prettier on `*.{json,md,html,css}`.
