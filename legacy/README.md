# Legacy Architecture Archive — The Abstract Take

> **NOTICE: This directory contains historical, archived code from the initial Vite / React SPA / Express implementation.**
> **It is NOT used in the active production build, deployment, or runtime.**

---

## 1. Authoritative Production Application

The sole authoritative production application for *The Abstract Take* is located at:

👉 **[`../next-app/`](../next-app/)** (Next.js 15 App Router + React 19 + Tailwind CSS v4 + Supabase PostgreSQL)

All new feature development, editorial enhancements, API updates, and styling must occur exclusively within `next-app/`.

---

## 2. Contents of this Archive

| Path | Description | Modern Replacement |
|---|---|---|
| `src/` | Historical React 19 + React Router SPA frontend | `next-app/app/` & `next-app/components/` |
| `server/` | Historical Express server route modules & controllers | `next-app/app/api/` & `next-app/lib/` |
| `server.ts` | Historical standalone Express server entrypoint | Next.js 15 App Router Server |
| `vite.config.ts` | Historical Vite 6 bundler configuration | `next-app/next.config.ts` |
| `index.html` | Historical Vite Single Page Application HTML shell | `next-app/app/layout.tsx` |

---

## 3. Purpose of Retention

These files are retained in the repository for:
1. **Historical Reference**: Tracking original architectural decisions and UI logic.
2. **Migration Traceability**: Verifying behavioral parity during framework transitions.
3. **Rollback & Recovery**: Reference material for restoring past experimental modules if needed.
