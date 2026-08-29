# ARCHIVED: LEGACY VITE + EXPRESS APPLICATION

> **STATUS: DEPRECATED & ARCHIVED**
> 
> This directory contains the historical Vite + React + Express single-page application.
> As of Phase 4.5, this legacy codebase has been formally deprecated.
> 
> The **sole authoritative production application** for *The Abstract Take* is now located in 
ext-app/ (Next.js 15 App Router).

## Deprecation Summary
- **Authoritative Application**: 
ext-app/ (Next.js 15)
- **Active Development**: All new features, editorial enhancements, and maintenance must occur within 
ext-app/.
- **Database & Media**: Supabase PostgreSQL and Cloudinary CDN connections belong exclusively to 
ext-app/.
- **Google Sheets Automation**: Route handlers in 
ext-app/app/api/automation/* are the authoritative automation endpoints.
- **Legacy Retention**: This folder is retained solely for historical reference and backup during the post-launch transition period.

## Legacy Reference Commands (Non-Production Only)
If historical verification is required:
- 
pm run legacy:dev — Starts legacy Express backend
- 
pm run legacy:build — Builds legacy Vite frontend & Express bundle
- 
pm run legacy:start — Runs legacy Express server
