# AGENTS.md

## Cursor Cloud specific instructions

This repo (`contract-app`) is a **frontend-only** SPA: Vue 3 + Vite + Ant Design Vue + Pinia + Vue Router. There is **no local backend**; the app talks to a **remote** backend through the Vite dev proxy. Standard scripts live in `package.json` (`dev`, `build:test`, `build:pro`, `preview`); package manager is **npm** (`package-lock.json`).

### Running the dev server
- Start with `npx vite --mode development` (serves on `http://localhost:8080`). The `npm run dev` script appends `--open`, which tries to launch a desktop browser; harmless in cloud but prefer `npx vite --mode development` to avoid the open warning.
- The dev server proxies `/api` → `https://contract.test.coslets.com` (rewrites the leading `/api` to ``). Outbound network access to that host is required; verify with `curl -m 20 -X POST https://contract.test.coslets.com/api/auth/login` (expect `{"errno":401,...}`).

### Required local env file (gitignored)
- A `.env.development` file with `VITE_API_URL=/api` is **required** for correct API routing. Without it, `process.env.API` is undefined and request paths bypass the intended proxy rewrite. `.env*` is gitignored, so this file is never committed; the update script recreates it if missing.

### Case-sensitivity gotcha (important)
- The repo was developed on a case-insensitive filesystem (macOS). On case-sensitive Linux, `src/router/pageRoutes.js` imports `@/views/Digital/Ledger/LedgerForm.vue` but the on-disk file is `ledgerForm.vue` (lowercase). Because `pageRoutes.js` is loaded eagerly by the router, this breaks the **entire** app at startup (Vite 500 / import-analysis failure), not just the ledger routes.
- Workaround (no source change): a symlink `src/views/Digital/Ledger/LedgerForm.vue -> ledgerForm.vue`. The update script creates it idempotently. If you ever see a Vite "Failed to resolve import" 500 for a `*.vue` file, suspect another filename-case mismatch.

### Lint / test / build
- **Lint:** none configured (no ESLint config, no `lint` script).
- **Tests:** no automated test runner configured. The files under `scripts/*.mjs` are one-off debug scripts that depend on data files not present in the repo.
- **Build:** `npm run build:test` / `npm run build:pro`. Builds read `VITE_API_URL` from `.env.<mode>`; for an ad-hoc build use e.g. `VITE_API_URL=/api npx vite build --mode test`. The build's `rollup-plugin-visualizer` writes `stats.html` and tries to open it (harmless in cloud).

### Auth / hello-world note
- All app functionality is gated behind a phone+password login against the remote backend. End-to-end "create a record" flows need **valid credentials** (none are provisioned in this environment). The login form is verified wired to the backend: submitting any phone/password reaches the API and returns an auth error.
