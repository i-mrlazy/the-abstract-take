# ⚠️ DATA DIRECTORY — DEPRECATED (BACKUP ONLY)

> **STATUS: DEPRECATED — BACKUP & MIGRATION ARTIFACT ONLY**
> 
> As of Phase 1 (Database & Storage Modernization), the primary production persistence layer for *The Abstract Take* is **Supabase PostgreSQL** (`reviews`, `recommendation_lists`, `what_to_watch_next`, `comments`, `newsletter_subscribers`, `site_settings`, `tags`).
> 
> The JSON files in this directory are preserved strictly as:
> 1. **Migration Source & Baseline Snapshot** for `scripts/migrateToJsonToSupabase.ts`.
> 2. **Local Development Fallback** when running completely offline without network or database credentials.

---

## 🗄️ JSON Files in this Directory

| File | Entity | Production Table Equivalent |
|---|---|---|
| `reviews.json` | Review Articles | `reviews` |
| `recommendations.json` | Curated Watchlists | `recommendation_lists` |
| `what_next.json` | What to Watch Next Picks | `what_to_watch_next` |
| `comments.json` | Moderated Comments | `comments` |
| `subscribers.json` | Newsletter Subscribers | `newsletter_subscribers` |
| `settings.json` | Global Site Configuration | `site_settings` |
| `tags.json` | Taxonomy Tags | `tags` |
| `uploads/` | Local Dev Uploads | Cloudinary CDN (`the-abstract-take/uploads`) |

---

## 📦 Safe Archival Procedure (Post-Production Launch)

Once production deployment to Supabase is verified and all live reviews are confirmed:
1. Create a cold archive zip: `tar -czvf data_backup_pre_supabase.tar.gz data/`
2. Store the compressed archive in secure offline storage.
3. In production serverless environments (Vercel), `data/*.json` and `data/uploads/` are never written to at runtime.
