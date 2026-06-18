# AGENTS.md

## Cursor Cloud specific instructions

This repo is a **frontend-only** Vue 3 + Vite SPA (合同管理系统 / contract management). There is **no local backend**; the dev server proxies `/api` to a remote test backend (`https://contract.test.coslets.com`, configured in `vite.config.js`).

### Services / how to run
- Dev server (the primary workflow): `npm run dev` → serves on `http://localhost:8080`. The `--open` flag is a no-op in headless environments.
- Build: `npm run build:test` (test mode) or `npm run build:pro` (prod). The build runs `rollup-plugin-visualizer` with `open: true` (a no-op headless) and writes `stats.html` / `dist/`.
- There is **no lint or test tooling** configured (no ESLint/Prettier/Vitest/Jest, no git hooks). Only `dev`, `build:test`, `build:pro`, `preview` scripts exist.

### Required dev config (non-obvious)
- A `.env.development` file with `VITE_API_URL=/api` is **required** for API calls to work. It is gitignored, so it is recreated by the startup update script. Without it, axios `baseURL` (`process.env.API`) is `undefined` and login/API requests do not reach the proxy.
- Why `/api`: axios `baseURL=/api` + endpoint paths that already start with `/api` (e.g. `src/api/login.js`) produce `/api/api/...`; the Vite proxy strips one leading `/api` and forwards to the remote backend. Net result hits the correct `https://contract.test.coslets.com/api/...` path.

### Known case-sensitivity bug (works on macOS, breaks on Linux)
- `src/router/pageRoutes.js` imports `@/views/Digital/Ledger/LedgerForm.vue`, but the actual file is `src/views/Digital/Ledger/ledgerForm.vue` (lowercase `l`). On case-insensitive filesystems (macOS) this resolves; on the case-sensitive Linux VM it throws "Failed to resolve import" for `pageRoutes.js`, which is imported at startup and therefore **breaks the entire dev app and the production build**.
- Workaround (does not touch tracked source): an untracked compatibility symlink `src/views/Digital/Ledger/LedgerForm.vue -> ledgerForm.vue`, recreated idempotently by the startup update script.
- Recommended permanent fix (do only if asked): correct the import casing in `src/router/pageRoutes.js` to `ledgerForm.vue`, then the symlink workaround can be dropped.

### Hello-world / smoke check
- Open `http://localhost:8080/` → redirects to `/login` (合同管理系统 login page). Submitting any phone/password posts to `/api/api/auth/login` via the proxy; invalid credentials return a backend toast like `登录名错误或用户被禁用`, confirming the frontend↔backend path works.
