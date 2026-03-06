# AGENTS.md

## Cursor Cloud specific instructions

### Project overview
TV Dashboard - Visual Factory: a React/TypeScript SPA (Vite) for displaying manufacturing work orders on TV screens. Pure frontend with Supabase as BaaS. See `README.md` for full details.

### Environment variables
A `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` is required. Without real Supabase credentials, the app renders but shows a connection error on routes that fetch data. Copy `.env.example` to `.env` and fill in credentials.

### Development commands
All standard commands are in `package.json`. Key ones:
- `npm run dev` — Vite dev server on port 3000 (all interfaces by default). Add `VITE_USE_HTTPS=false` if no certs are generated.
- `npm run lint` — ESLint (flat config)
- `npm run typecheck` — TypeScript check via `tsconfig.typecheck.json`
- `npm run test:ci` — Vitest in run mode
- `npm run build` — Production build to `dist/`

### Known issues (pre-existing)
- **Typecheck**: `src/components/SettingsPage.tsx` has a TS2345 error (pre-existing, not introduced by setup).
- **Tests**: 5 test files have pre-existing failures (mostly `useWorkOrderActions`, `useWorkOrders`, `useOrderHistory` hooks) related to missing `QueryClientProvider` wrappers and mock setup issues. 10 of 15 test files pass.
- **Build config**: `vite.config.ts` references `clsx` and `tailwind-merge` in `manualChunks` but these were not in `package.json`. They must be installed for builds to succeed (`npm install clsx tailwind-merge`).

### Gotchas
- The Vite config tries to load HTTPS certs from `certs/localhost.crt` and `certs/localhost.key`. Set `VITE_USE_HTTPS=false` in `.env` to skip HTTPS when certs don't exist.
- Husky pre-commit hook runs `lint-staged` (ESLint on `.ts/.tsx`, Prettier on `.json/.md/.html/.css`). Use `--no-verify` if needed.
