# 🎬 The Abstract Take — Bulk Editorial Automation Architecture
### Google Sheets + Google Apps Script + Gemini AI + Web Application Backend

This architecture allows the creator of **The Abstract Take** to efficiently process, generate, and publish hundreds or thousands of previously watched movies, TV series, and anime reviews without manual per-review data entry.

---

## 🏗️ System Architecture & Workflow

```
+-------------------------------------------------------------+
| 1. CREATOR INPUT (Google Sheet)                             |
|    - Title, Year, Media Type, Rating (1–10)                 |
|    - Raw Take (Unfiltered notes)                            |
|    - Likes, Dislikes, Personal Verdict                      |
|    - Status: "Pending"                                      |
+------------------------------+------------------------------+
                               |
                               | (Every 5 mins / Manual run)
                               v
+-------------------------------------------------------------+
| 2. GOOGLE APPS SCRIPT ENGINE                                |
|    - Validates minimum required fields                      |
|    - Checks LockService (Prevents race conditions)          |
|    - Sends structured payload to Backend Generate API       |
+------------------------------+------------------------------+
                               |
                               | (POST /api/automation/generate)
                               v
+-------------------------------------------------------------+
| 3. THE ABSTRACT TAKE BACKEND & GEMINI ENGINE                |
|    - Enforces Editorial Hierarchy (Creator Opinion 1st)     |
|    - Generates ~250–300 word polished critique              |
|    - Extracts Pros, Cons, Verdict, SEO, Tags                |
+------------------------------+------------------------------+
                               |
                               | (Returns Structured JSON)
                               v
+-------------------------------------------------------------+
| 4. SHEET UPDATED & APPROVAL GATE                            |
|    - Populates Generated Columns (Headline, Review, etc.)   |
|    - Sets Status: "Review generated"                        |
|    - CREATOR REVIEWS THE CONTENT                            |
|    - Creator manually changes Status to: "Publish it"       |
+------------------------------+------------------------------+
                               |
                               | (POST /api/automation/publish)
                               v
+-------------------------------------------------------------+
| 5. REAL DATABASE INGESTION & PUBLICATION                    |
|    - Idempotency check (No duplicates created)              |
|    - Enriches posters, banners, director, cast metadata     |
|    - Inserts into public database (data/reviews.json)       |
|    - Live immediately across Latest Takes, Genres, Search   |
|    - Sets Status: "Published" & writes Public URL           |
+-------------------------------------------------------------+
```

---

## 📋 1. Google Sheet Column Layout

The Google Sheet consists of **21 columns** in the exact order below:

| # | Column Name | Required? | Description & Examples |
|---|---|---|---|
| **A** (1) | `TITLE` | **Yes** | e.g. `Dune: Part Two`, `Challengers`, `Severance` |
| **B** (2) | `RELEASE YEAR` | **Yes** | e.g. `2024` |
| **C** (3) | `CONTENT TYPE` | **Yes** | Dropdown: `Movie`, `Series`, `Mini Series`, `Anime`, `Documentary`, `Special` |
| **D** (4) | `EXTERNAL MEDIA ID` | No | Optional TMDB or IMDb ID (e.g. `tt15239678`) |
| **E** (5) | `RATING` | **Yes** | Creator's authoritative score from `1` to `10` |
| **F** (6) | `MY RAW TAKE` | **Yes** | Unfiltered creator impressions, thoughts, pacing, direction notes |
| **G** (7) | `THINGS I LIKED` | No | Specific strengths (e.g. `Hans Zimmer score, Austin Butler performance`) |
| **H** (8) | `THINGS I DIDN'T LIKE` | No | Specific critiques (e.g. `Rushed final 15 minutes`) |
| **I** (9) | `PERSONAL VERDICT` | **Yes** | Closing takeaway (e.g. `A towering modern sci-fi classic.`) |
| **J** (10) | `ADDITIONAL NOTES` | No | Technical details, facts, or adaptation background |
| **K** (11) | `GENERATED HEADLINE` | *Auto* | Populated by Gemini |
| **L** (12) | `GENERATED REVIEW` | *Auto* | Populated by Gemini (~250–300 words) |
| **M** (13) | `GENERATED PROS` | *Auto* | Extracted highlights (one per line) |
| **N** (14) | `GENERATED CONS` | *Auto* | Extracted critiques (one per line) |
| **O** (15) | `GENERATED VERDICT` | *Auto* | Formatted verdict text |
| **P** (16) | `GENERATED SEO DESCRIPTION` | *Auto* | Meta description for search engines |
| **Q** (17) | `GENERATED TAGS` | *Auto* | Comma-separated editorial tags |
| **R** (18) | `STATUS` | **Yes** | Dropdown: `Pending`, `Review generated`, `Publish it`, `Published` |
| **S** (19) | `PUBLISHED URL` | *Auto* | Live website URL written after publication |
| **T** (20) | `LAST PROCESSED` | *Auto* | ISO timestamp of last automation activity |
| **U** (21) | `AUTOMATION NOTES` | *Auto* | Diagnostic logs, error messages, or publication confirmation |

---

## 🚦 2. Google Sheet Status State Machine

| Status | Set By | Meaning & Behavior |
|---|---|---|
| **`Pending`** | Creator (Default) | Editorial input is complete and waiting for generation. The automation will generate the review only when all required fields are present and `GENERATED REVIEW` is empty. |
| **`Review generated`** | Automation | Review has been synthesized and written back to the sheet. **The system will never overwrite or regenerate this automatically.** |
| **`Publish it`** | Creator (Manual Gate) | **The hard editorial approval gate.** The creator has reviewed the content and authorized publication. |
| **`Published`** | Automation | The review has been successfully created in The Abstract Take database. The public canonical URL is written into column `PUBLISHED URL`. |

---

## ⚙️ 3. Backend Environment Variables

In your backend `.env` file (see [`.env.example`](file:///C:/Users/itspr/take/.env.example)):

```bash
# Google Sheets Bulk Automation Secret Key (Must match CONFIG.AUTOMATION_SECRET in Google Apps Script)
GOOGLE_SHEETS_AUTOMATION_SECRET="the_abstract_take_sheets_automation_secret_key_2026"

# Canonical Site URL for generated public links
SITE_BASE_URL="http://localhost:3000" # or "https://theabstracttake.com"
```

---

## 🚀 4. Google Sheets Setup Guide (Step-by-Step)

### Step 1: Open Google Sheets
1. Create a new Google Sheet named **`The Abstract Take - Editorial Backlog`**.
2. Rename the first tab to **`Reviews Backlog`**.

### Step 2: Open Apps Script Editor
1. In Google Sheets, click **Extensions** > **Apps Script**.
2. Delete any default code in `Code.gs`.
3. Copy the entire contents of [`google_apps_script/Code.gs`](file:///C:/Users/itspr/take/google_apps_script/Code.gs) and paste it into the editor.

### Step 3: Configure Settings in `Code.gs`
Update the `CONFIG` object at the top of the script:
```javascript
var CONFIG = {
  // Your deployed website URL or ngrok tunnel during development
  API_BASE_URL: "https://your-domain.com", // or "http://localhost:3000"

  // Must match GOOGLE_SHEETS_AUTOMATION_SECRET in backend .env
  AUTOMATION_SECRET: "the_abstract_take_sheets_automation_secret_key_2026",

  SHEET_NAME: "Reviews Backlog",
  // ...
};
```

### Step 4: Save & Initialize Template
1. In the Apps Script toolbar, click **Save** (💾).
2. Switch back to your Google Sheet and refresh the page.
3. You will see a new menu: **🎬 The Abstract Take**.
4. Click **🎬 The Abstract Take** > **📋 Setup Sheet Headers & Validation**.
   *(Grant permissions when prompted by Google).*
5. The script will automatically format all 21 columns, set dark header styling, and configure the Status dropdowns.

### Step 5: Test Connection
Click **🎬 The Abstract Take** > **🔍 Test Backend Connection**. You should see:
`✅ Connection Successful! Service: The Abstract Take - Google Sheets Automation Engine`.

### Step 6: Enable Automatic 5-Minute Trigger
Click **🎬 The Abstract Take** > **⏰ Install Automatic 5-Min Trigger**.
The automation will now run silently in the background every 5 minutes!

---

## 🔒 5. Idempotency & Duplicate Prevention

1. **Unique Slug Generation**: Every review is slugified using `title-releaseYear` (e.g. `dune-part-two-2024`).
2. **Key Matching**: If a Publish request is resent for an existing row ID or slug:
   - The backend **updates** the existing review instead of creating a duplicate.
   - Preserves existing page view counts, comments, and IDs.
   - Returns the existing canonical URL.
3. **LockService**: Apps Script uses `LockService.getScriptLock()` to prevent duplicate concurrent executions.

---

## 🔄 6. Managing & Retrying Reviews

- **How to Regenerate a Review**:
  If you edit your raw take and want a fresh generation, simply set `STATUS` back to `Pending` and clear the `GENERATED REVIEW` cell.
- **Handling Errors**:
  If a row has missing information or a network timeout occurs:
  - `STATUS` remains `Pending` (or `Publish it`).
  - The exact error is recorded in `AUTOMATION NOTES`.
  - Fix the cell and it will automatically retry on the next cycle.
