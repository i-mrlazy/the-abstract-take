# The Abstract Take — Cinema & Television Critique Platform

> **An independent entertainment review, curated recommendation, and cinematic commentary publication.**

---

## 1. Project Overview

*The Abstract Take* is an editorial-first media platform delivering structured critiques, creator takes, and curated watchlists across Movies, Series, Anime, Documentaries, Mini-Series, and Specials.

- **Authoritative Application Root**: `next-app/` (Next.js 15 App Router)
- **Deployment Platform**: Vercel
- **Database Authority**: Supabase PostgreSQL
- **Media CDN**: Cloudinary
- **AI Editorial Assistant**: Google Gemini 2.5 Flash
- **Editorial Automation**: Google Sheets + Google Apps Script Engine

---

## 2. Technology Stack

- **Framework**: Next.js 15 (App Router, Server Components, Route Handlers, ISR)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons
- **Database & Persistence**: Supabase PostgreSQL (`@supabase/supabase-js`)
- **Media Storage & CDN**: Cloudinary Media API
- **AI Intelligence**: Google GenAI SDK (`@google/genai` Gemini 2.5 Flash)
- **External Metadata**: TMDb (The Movie Database) v3 API
- **Authentication**: Stateless PBKDF2 (SHA-512) Password Hashing + Cryptographic HMAC-SHA256 Signed JWT in Secure HTTP-Only Cookies
- **Editorial Automation**: Google Apps Script & Server-to-Server Webhook API

---

## 3. Project Architecture

```
take/
├── next-app/                      <-- ACTIVE AUTHORITATIVE APPLICATION (Next.js 15)
│   ├── app/                       <-- App Router Pages, Layouts, Metadata, & API Routes
│   │   ├── (public)/              <-- Reviews, Recommends, What-Next, Search, Archives
│   │   ├── admin/                 <-- Admin CMS Console (Reviews, Media, Taxonomy, Moderation)
│   │   ├── api/                   <-- Server Route Handlers (Auth, Automation, Media, Cron)
│   │   └── sitemap.ts / robots.ts <-- Dynamic SEO Infrastructure
│   ├── components/                <-- UI Primitives, Cards, Navigation, and Admin Modals
│   ├── lib/                       <-- Database Repositories, Auth, Cloudinary, SEO, Gemini
│   ├── types/                     <-- Core TypeScript Domain Definitions
│   ├── public/                    <-- Static Brand Assets
│   ├── vercel.json                <-- Production Vercel Cron Configuration
│   └── package.json               <-- Next.js Scripts & Dependencies
│
├── google_apps_script/            <-- Google Apps Script Bulk Automation Code (`Code.gs`)
├── package.json                   <-- Root Delegator (Delegates default commands to next-app)
├── .env.example                   <-- Authoritative Environment Variable Template
├── LEGACY_ARCHIVE_README.md       <-- Archival Notice for Deprecated Vite+Express App
│
├── src/                           <-- ARCHIVED: Legacy Vite Frontend
└── server/                        <-- ARCHIVED: Legacy Express Backend
```

---

## 4. Development & Setup

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/the-abstract-take.git
cd the-abstract-take

# Install dependencies (Root and Next.js app)
npm install
npm --prefix next-app install
```

### Environment Configuration
Copy `.env.example` to `.env.local` inside `next-app/` (or root `.env`):
```bash
cp .env.example next-app/.env.local
```
Fill in the development placeholders for Supabase, Cloudinary, Gemini, and Admin credentials.

---

## 5. Development & Build Commands

All standard commands executed from the project root delegate automatically to the authoritative Next.js application:

```bash
# Start local development server (http://localhost:3000)
npm run dev

# Run TypeScript typecheck
npm run lint

# Build production application (Static pages & dynamic routes)
npm run build

# Start production server locally
npm run start
```

### Legacy Reference Commands
The historical Vite + Express application is preserved for archival reference:
```bash
npm run legacy:dev     # Legacy Express backend
npm run legacy:build   # Legacy Vite build
npm run legacy:start   # Legacy Express server
```

---

## 6. Editorial CMS Console

The CMS console is accessible at `/admin` and protected by edge middleware authentication:
- **Dashboard**: High-level platform statistics and quick actions.
- **Reviews Manager**: Create, edit, schedule, draft, duplicate, and live-preview reviews.
- **Media Uploader**: Direct upload to Cloudinary with automatic optimization.
- **AI Editorial Assistant**: Generate headlines, voice-conditioned critiques, pros/cons, and SEO descriptions via Gemini 2.5 Flash.
- **Taxonomy & Settings**: Manage tags, categories, site metadata, and comment moderation.

---

## 7. Google Sheets Editorial Automation

Bulk review writing and automated publishing are orchestrated through Google Sheets:
1. **Google Sheet (`Reviews Backlog`)**: Enter review data and set status to `Pending`.
2. **AI Draft Generation**: Trigger Apps Script &rarr; `POST /api/automation/generate` &rarr; Populates polished draft with `Review generated` status and `GENERATION SOURCE` tracking.
3. **Creator Review & Approval**: Creator reviews draft and sets status to `Publish it`.
4. **Publish Execution**: Apps Script &rarr; `POST /api/automation/publish` &rarr; Persists review to Supabase PostgreSQL, invalidates cache, and updates status to `Published` with canonical URL.

---

## 8. Deployment Architecture (Vercel)

- **Vercel Root Directory**: `next-app`
- **Output Directory**: `.next`
- **Scheduled Publishing**: Configured via `next-app/vercel.json` to execute hourly on `/api/cron/publish-scheduled` with `CRON_SECRET` authentication.

---

## 9. Security & Secret Hygiene

- **Zero Secrets in Source Control**: No production keys, passwords, service role secrets, or `.env` files are committed.
- **Defense in Depth**: PBKDF2 password verification with 100,000 iterations, constant-time comparison, and HTTP-only SameSite session cookies.

