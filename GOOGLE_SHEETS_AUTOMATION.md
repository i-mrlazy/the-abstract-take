# 📊 The Abstract Take — Editorial Memory Capture & Bulk Pipeline Engine (Phase 5.3)

An authoritative, production-grade Google Sheets editorial automation pipeline for **The Abstract Take** film and television critique publication.

---

## 🏗️ 1. Architecture & Editorial Philosophy

The Abstract Take operates on a **creator-first editorial model** and a **strict score authority framework**:

1. **Strict Score Authority (Authoritative)**: The founder's Abstract Score (1–10) is absolute. AI is never permitted to modify or second-guess the score. The generated tone, critique, pros, cons, and verdict are calibrated strictly to match the score tier (10/10 vs 7/10 vs 4/10).
2. **Editorial Memory Signals**: The founder inputs rough viewing reactions (likes, dislikes, emotional reactions, pacing, favorite moments). AI structures these signals into a polished critique **without fabricating personal memories or unmentioned viewing experiences**.
3. **Mandatory Human Approval & CMS Draft Ingestion**: Generated reviews are never published directly. All imported reviews enter the CMS database as **`draft`**, allowing the founder to perform the final editorial audit, adjust signals, and publish on demand.
4. **Independent First-Party Schema**: All metadata is self-contained and adheres to The Abstract Take 1–10 taxonomy, artwork provenance, and recommendation profile architecture.

```
+-----------------------------------------------------------------------------------+
| 1. FOUNDER MEMORY CAPTURE (Google Sheet Columns A–K)                              |
|    - Title, Release Year, Content Type, Authoritative Score (1–10)                |
|    - Quick Thesis, What Worked, What Didn't, Memory Notes, Target Length          |
|    - Generation Status: READY_FOR_GENERATION                                      |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 2. AI EDITORIAL GENERATION (/api/automation/generate or Direct Gemini 2.5 Flash)  |
|    - Calibrates editorial tone to exact score tier (10/10 vs 7/10)                |
|    - Targets word count: Quick (125w), Standard (280w), Deep (750w), Essay (1600w)|
|    - Generates structured JSON + preview text                                     |
|    - Generation Status: GENERATED · Editorial Status: AI_DRAFT_READY              |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 3. FOUNDER EDITORIAL AUDIT & APPROVAL (Google Sheet Columns W–AA)                 |
|    - Founder audits AI draft preview / JSON in Google Sheets                      |
|    - Sets Editorial Status: APPROVED                                              |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 4. SECURE CMS DRAFT IMPORT (/api/admin/import-reviews)                            |
|    - Server-side JWT / Secret authorization                                       |
|    - Duplicate Detection (Normalized title + year / slug)                         |
|    - Creates review as status: 'draft' in database                                |
|    - Sets CMS Import Status: IMPORTED_TO_CMS                                      |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| 5. CMS EDITORIAL MANAGEMENT & PRODUCTION PUBLICATION (/admin/reviews)             |
|    - Founder inspects draft in CMS Review Editor                                  |
|    - Fine-tunes tags, streaming links, artwork, and clicks "Publish Take"         |
|    - Live on https://the-abstract-take.vercel.app                                 |
+-----------------------------------------------------------------------------------+
```

---

## 📋 2. Complete 34-Column Google Sheet Layout (A through AH)

| # | Col | Column Name | Type | Description & Example |
|---|---|---|---|---|
| **1** | `A` | `TITLE` | **Required** | Title of the film / series (e.g. `Dune: Part Two`) |
| **2** | `B` | `RELEASE YEAR` | Optional | Release Year (e.g. `2024`) |
| **3** | `C` | `CONTENT TYPE` | **Required** | Dropdown: `Movie`, `Series`, `Mini Series`, `Anime`, `Documentary`, `Special` |
| **4** | `D` | `FOUNDER SCORE` | **Required** | Authoritative Abstract Score (`1` to `10`) |
| **5** | `E` | `QUICK THESIS` | Optional | Core take / hook (e.g. `Towering visual sci-fi masterpiece with immaculate sound`) |
| **6** | `F` | `WHAT WORKED` | Optional | Highlights & strengths (e.g. `Cinematography, Austin Butler performance, score`) |
| **7** | `G` | `WHAT DIDNT` | Optional | Weaknesses & flaws (e.g. `Slightly compressed third act pacing`) |
| **8** | `H` | `FAVORITE SCENE` | Optional | Standout sequence (e.g. `The spice harvester assault on Arrakis`) |
| **9** | `I` | `FAVORITE QUOTE` | Optional | Memorable dialogue or line |
| **10** | `J` | `VIEWING MEMORY NOTES` | Optional | Rough memories, emotional vibe, rewatchability (e.g. `Immersive in IMAX 70mm`) |
| **11** | `K` | `TARGET REVIEW LENGTH` | Optional | Dropdown: `Quick Take` (125w), `Standard Take` (280w), `Deep Take` (750w), `Essay` |
| **12** | `L` | `ORIGINAL TITLE` | Optional | Non-English or alternate title (e.g. `Kaibutsu`) |
| **13** | `M` | `DIRECTOR` | Optional | Director / Creator name |
| **14** | `N` | `LEAD CAST` | Optional | Comma-separated cast members |
| **15** | `O` | `RUNTIME` | Optional | e.g. `2h 46m` |
| **16** | `P` | `PRIMARY GENRES` | Optional | e.g. `Sci-Fi, Adventure` |
| **17** | `Q` | `THEMES & MOODS` | Optional | e.g. `Power, Prophecy, Atmospheric` |
| **18** | `R` | `GENERATION STATUS` | **Status** | `NOT_STARTED`, `READY_FOR_GENERATION`, `GENERATING`, `GENERATED`, `GENERATION_FAILED` |
| **19** | `S` | `GENERATED JSON` | *Auto* | Full structured JSON payload compatible with `Review` schema |
| **20** | `T` | `GENERATED REVIEW PREVIEW` | *Auto* | Formatted text preview for human reading |
| **21** | `U` | `AI GENERATION NOTES` | *Auto* | Generation source and calibration notes |
| **22** | `V` | `GENERATION TIMESTAMP` | *Auto* | ISO timestamp of generation completion |
| **23** | `W` | `EDITORIAL STATUS` | **Status** | `MEMORY_CAPTURE`, `AI_DRAFT_READY`, `NEEDS_REVIEW`, `NEEDS_REVISION`, `APPROVED`, `REJECTED` |
| **24** | `X` | `FOUNDER REVIEW NOTES` | Optional | Founder feedback or revision directives |
| **25** | `Y` | `FINAL APPROVED JSON` | Optional | Approved JSON payload ready for CMS ingestion |
| **26** | `Z` | `APPROVED BY` | Optional | e.g. `Founder / Chief Editor` |
| **27** | `AA` | `APPROVAL TIMESTAMP` | *Auto* | Timestamp of founder approval |
| **28** | `AB` | `CMS IMPORT STATUS` | **Status** | `NOT_IMPORTED`, `IMPORTED_TO_CMS`, `IMPORT_FAILED`, `DUPLICATE_SKIPPED` |
| **29** | `AC` | `WEBSITE PUBLICATION STATUS` | **Status** | `DRAFT`, `SCHEDULED`, `PUBLISHED` |
| **30** | `AD` | `PUBLISHED URL` | *Auto* | Live website URL once published |
| **31** | `AE` | `PUBLICATION TIMESTAMP` | *Auto* | Timestamp of publication |
| **32** | `AF` | `INTERNAL ID` | *Auto* | Unique pipeline tracking ID (e.g. `take-178793-r2`) |
| **33** | `AG` | `ERROR LOG` | *Auto* | Diagnostic error log or retry explanation |
| **34** | `AH` | `LAST UPDATED` | *Auto* | Timestamp of last modification |

---

## 🚦 3. State Machine Workflow

```
[ MEMORY CAPTURE ]
       │
       ▼ (Set Generation Status: READY_FOR_GENERATION)
[ READY_FOR_GENERATION ]
       │
       ▼ (Batch/Single Generation Execution)
[ GENERATING ]
       │
       ├─────────────────────────────────┐
       ▼ (Valid JSON & Score Verified)   ▼ (Validation/API Error)
[ GENERATED ]                     [ GENERATION_FAILED ]
       │                                 │ (Fix notes & retry)
       ▼ (Editorial Status)              └───────────► [ READY_FOR_GENERATION ]
[ AI_DRAFT_READY ]
       │
       ▼ (Founder Audit)
[ NEEDS_REVIEW / NEEDS_REVISION ]
       │
       ▼ (Founder Approval)
[ APPROVED ]
       │
       ▼ (Import Approved to CMS)
[ IMPORTED_TO_CMS (Created as DRAFT) ]
       │
       ▼ (CMS Review & Publish)
[ PUBLISHED (Live URL written) ]
```

---

## 🔒 4. Security & Script Properties Setup

API keys are **never** hardcoded in the Apps Script codebase. They are stored securely in Google Apps Script `Script Properties`:

1. Open your Google Sheet > **Extensions** > **Apps Script**.
2. Click **⚙️ Project Settings** (gear icon on left sidebar).
3. Scroll to **Script Properties** and add:
   * `GEMINI_API_KEY`: Your Google Gemini AI API Key
   * `API_BASE_URL`: `https://the-abstract-take.vercel.app` (or `http://localhost:3000`)
   * `AUTOMATION_SECRET`: Must match `AUTOMATION_SECRET` in Next.js `.env`

Alternatively, configure them via the custom sheet menu:
**🎬 The Abstract Take** > **⚙️ Settings & Configuration** > **🔑 Set Gemini API Key**.

---

## ⚙️ 5. Google Sheet Menu Features

When you open the sheet, the custom menu provides one-click automation controls:

* **✨ Generate Review for Selected Row**: Generates review for the active cursor row.
* **⚡ Generate Reviews for Ready Rows**: Processes a controlled batch of 3–5 rows marked `READY_FOR_GENERATION`.
* **🔍 Validate Selected Review JSON**: Validates that JSON is well-formed and respects Score Authority.
* **📝 Mark Selected Row Ready for Editorial Review**: Switches status to `NEEDS_REVIEW`.
* **✅ Approve Selected Review**: Copies JSON to `FINAL APPROVED JSON` and marks `APPROVED`.
* **🚀 Import Approved Reviews to CMS (Drafts)**: Securely sends all unimported approved reviews to `/api/admin/import-reviews`.
* **📦 Export Approved Reviews JSON**: Opens a copy-paste modal containing approved reviews JSON.
* **📊 View Pipeline Status**: Displays counts of all rows across pipeline stages.
* **📋 Setup 34-Column Sheet Template**: Auto-formats headers, colors, and dropdown validations.

---

## 🛡️ 6. Duplicate Prevention & Safety Controls

1. **Normalized Matching**: Prevents duplicate entries using primary key (`normalized title + releaseYear`) and secondary key (`slug`).
2. **Batch Size Control**: Apps Script limits batch executions to 3–5 rows per run with `LockService` to prevent simultaneous execution collisions.
3. **Mandatory Draft Mode**: `/api/admin/import-reviews` always stores reviews as `status: 'draft'`. No review is ever published automatically without final editorial sign-off.
