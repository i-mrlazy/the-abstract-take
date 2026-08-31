/**
 * ==============================================================================
 * THE ABSTRACT TAKE — EDITORIAL MEMORY CAPTURE & BULK PIPELINE ENGINE (v5.3)
 * ==============================================================================
 * Google Apps Script for automated editorial memory capture, AI review generation,
 * score authority enforcement, controlled batching, and secure CMS draft import.
 *
 * ARCHITECTURE:
 * Google Sheet → Google Apps Script → Gemini API (gemini-3.6-flash) / Backend → CMS Drafts
 *
 * EDITORIAL PRINCIPLES:
 * 1. STRICT SCORE AUTHORITY — Founder's Abstract Score (1–10) is absolute and never altered.
 * 2. EDITORIAL MEMORY SIGNALS — AI structures founder's notes without fabricating personal experiences.
 * 3. MANDATORY APPROVAL — Reviews must be approved by founder and imported as CMS drafts before publishing.
 * 4. ATOMIC GENERATION & WRITE VERIFICATION — Status "Generated" only assigned after verified non-empty JSON write.
 * 5. ROBUST EXPONENTIAL BACKOFF RETRIES — Automatic retry handling for temporary 429/500/502/503/504 errors.
 * ==============================================================================
 */

// ==============================================================================
// 1. CONFIGURATION & CANONICAL WORKFLOW STATUSES
// ==============================================================================
var CONFIG = {
  SHEET_NAME: "Editorial Pipeline",

  // Canonical Google Sheet Workflow Statuses (Column G)
  STATUS: {
    IDEA: "Idea",
    READY_FOR_GENERATION: "Ready For Generation",
    GENERATING: "Generating",
    GENERATED: "Generated",
    NEEDS_REVIEW: "Needs Review",
    APPROVED: "Approved",
    IMPORTED_TO_CMS: "Imported to CMS",
    PUBLISHED: "Published",
    REWATCH_REQUIRED: "Rewatch Required",
    GENERATION_FAILED: "Generation Failed",
  },

  CANONICAL_STATUS_LIST: [
    "Idea",
    "Ready For Generation",
    "Generating",
    "Generated",
    "Needs Review",
    "Approved",
    "Imported to CMS",
    "Published",
    "Rewatch Required",
    "Generation Failed",
  ],

  // Default 34-Column Fallback Index Map (1-indexed)
  COL: {
    TITLE: 1,                 // A
    RELEASE_YEAR: 2,          // B
    CONTENT_TYPE: 3,          // C
    FOUNDER_SCORE: 4,         // D
    QUICK_THESIS: 5,          // E
    WHAT_WORKED: 6,           // F
    WHAT_DIDNT: 7,            // G
    FAVORITE_SCENE: 8,        // H
    FAVORITE_QUOTE: 9,        // I
    VIEWING_NOTES: 10,        // J
    TARGET_LENGTH: 11,        // K

    ORIGINAL_TITLE: 12,       // L
    DIRECTOR: 13,             // M
    LEAD_CAST: 14,            // N
    RUNTIME: 15,              // O
    PRIMARY_GENRES: 16,       // P
    THEMES_MOODS: 17,         // Q

    GENERATION_STATUS: 18,    // R
    GENERATED_JSON: 19,       // S
    GENERATED_PREVIEW: 20,    // T
    AI_NOTES: 21,             // U
    GENERATION_TIME: 22,      // V

    EDITORIAL_STATUS: 23,     // W
    FOUNDER_NOTES: 24,        // X
    FINAL_APPROVED_JSON: 25,  // Y
    APPROVED_BY: 26,          // Z
    APPROVAL_TIME: 27,        // AA

    CMS_IMPORT_STATUS: 28,    // AB
    WEBSITE_PUB_STATUS: 29,   // AC
    PUBLISHED_URL: 30,        // AD
    PUB_TIME: 31,             // AE

    INTERNAL_ID: 32,          // AF
    ERROR_LOG: 33,            // AG
    LAST_UPDATED: 34,         // AH
  },

  // Batch Generation Limits
  MAX_BATCH_SIZE: 5,

  // Retry Strategy Parameters (Bounded Exponential Backoff for Google Apps Script)
  RETRY: {
    MAX_ATTEMPTS: 4,
    DELAYS_MS: [2000, 5000, 10000],
    RETRYABLE_CODES: [429, 500, 502, 503, 504],
  },
};

var CANONICAL_MEDIA_TYPES = ["Movie", "Series", "Anime", "Documentary", "Mini Series", "Special"];
var CANONICAL_WATCH_VERDICTS = ["Must Watch", "Recommended", "For Fans", "Skip"];

/**
 * Normalizes any workflow status to exact canonical Google Sheet status string.
 */
function normalizeWorkflowStatus(status) {
  if (!status || typeof status !== "string") return null;
  var cleaned = status.toLowerCase().trim().replace(/[\s_-]+/g, "");

  if (cleaned === "idea") return "Idea";
  if (cleaned === "readyforgeneration" || cleaned === "ready") return "Ready For Generation";
  if (cleaned === "generating") return "Generating";
  if (cleaned === "generated" || cleaned === "aidraftready" || cleaned === "draftready") return "Generated";
  if (cleaned === "needsreview" || cleaned === "review" || cleaned === "needsrevision") return "Needs Review";
  if (cleaned === "approved") return "Approved";
  if (cleaned === "importedtocms" || cleaned === "imported" || cleaned === "cmsdraft" || cleaned === "importedcms") return "Imported to CMS";
  if (cleaned === "published") return "Published";
  if (cleaned === "rewatchrequired" || cleaned === "rewatch") return "Rewatch Required";
  if (cleaned === "generationfailed" || cleaned === "failed" || cleaned === "error") return "Generation Failed";

  return null;
}

/**
 * Normalizes user-entered or AI-generated media type string to exact canonical CMS MediaType:
 * "Movie" | "Series" | "Anime" | "Documentary" | "Mini Series" | "Special"
 * Returns null if unrecognized or invalid (never silently defaults to Movie).
 */
function normalizeContentType(type) {
  if (!type || typeof type !== "string") return null;
  var cleaned = type.toLowerCase().trim().replace(/[\s_-]+/g, "");

  if (
    cleaned === "movie" ||
    cleaned === "movies" ||
    cleaned === "film" ||
    cleaned === "films" ||
    cleaned === "feature" ||
    cleaned === "featurefilm" ||
    cleaned === "featuremovie"
  ) {
    return "Movie";
  }

  if (
    cleaned === "series" ||
    cleaned === "tvseries" ||
    cleaned === "tv" ||
    cleaned === "television" ||
    cleaned === "show" ||
    cleaned === "shows" ||
    cleaned === "tvshow"
  ) {
    return "Series";
  }

  if (
    cleaned === "anime" ||
    cleaned === "animation" ||
    cleaned === "animefeature" ||
    cleaned === "animeseries"
  ) {
    return "Anime";
  }

  if (
    cleaned === "documentary" ||
    cleaned === "documentaries" ||
    cleaned === "doc" ||
    cleaned === "docs"
  ) {
    return "Documentary";
  }

  if (
    cleaned === "miniseries" ||
    cleaned === "limitedseries" ||
    cleaned === "miniserie"
  ) {
    return "Mini Series";
  }

  if (
    cleaned === "special" ||
    cleaned === "specials" ||
    cleaned === "standalone"
  ) {
    return "Special";
  }

  return null;
}

/**
 * Normalizes shouldYouWatch to one of: "Must Watch" | "Recommended" | "For Fans" | "Skip"
 * Preferred score defaults:
 * 10, 9 -> "Must Watch"
 * 8, 7, 6 -> "Recommended"
 * 5 -> "For Fans"
 * 4, 3, 2, 1 -> "Skip"
 */
function normalizeWatchVerdict(verdict, score) {
  if (verdict && typeof verdict === "string") {
    var v = verdict.trim();
    if (
      v === "Must Watch" ||
      v === "Recommended" ||
      v === "For Fans" ||
      v === "Skip"
    ) {
      return v;
    }
  }

  var s = Number(score);
  if (isNaN(s)) s = 8;
  if (s > 10) s = Math.round(s / 10);
  s = Math.max(1, Math.min(10, Math.round(s)));

  if (s >= 9) return "Must Watch";
  if (s >= 6) return "Recommended";
  if (s >= 5) return "For Fans";
  return "Skip";
}

/**
 * Returns the exact editorial word descriptor for a 1-10 Abstract Score
 */
function getScoreDescriptor(score) {
  var s = Number(score);
  if (isNaN(s)) s = 8;
  if (s > 10) s = Math.round(s / 10);
  s = Math.max(1, Math.min(10, Math.round(s)));

  var map = {
    10: "Masterpiece",
    9: "Brilliant",
    8: "Amazing",
    7: "Good",
    6: "Decent",
    5: "Average",
    4: "Underwhelming",
    3: "Poor",
    2: "Unbearable",
    1: "Shouldn't Have Been Made",
  };
  return map[s] || "Good";
}

// ==============================================================================
// 2. DYNAMIC HEADER-BASED COLUMN RESOLUTION
// ==============================================================================
/**
 * Scans Row 1 of the sheet to dynamically resolve column indexes.
 * Supports both the standard 8-column layout (A–H) and the full 34-column layout.
 */
function getColumnMap(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) lastCol = 34;
  var headerValues = sheet.getRange(1, 1, 1, Math.max(lastCol, 34)).getValues()[0];

  var map = {};
  for (var i = 0; i < headerValues.length; i++) {
    var raw = String(headerValues[i] || "").trim();
    if (!raw) continue;
    var norm = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    map[norm] = i + 1; // 1-indexed column number
  }

  function resolveCol(candidates, fallbackIndex) {
    for (var k = 0; k < candidates.length; k++) {
      var normCandidate = candidates[k].toLowerCase().replace(/[^a-z0-9]/g, "");
      if (map[normCandidate] !== undefined) {
        return map[normCandidate];
      }
    }
    return fallbackIndex;
  }

  return {
    TITLE: resolveCol(["title", "review title", "film title", "name"], CONFIG.COL.TITLE),
    RELEASE_YEAR: resolveCol(["release year", "year", "release_year"], CONFIG.COL.RELEASE_YEAR),
    CONTENT_TYPE: resolveCol(["media type", "content type", "type", "format", "media_type"], CONFIG.COL.CONTENT_TYPE),
    FOUNDER_SCORE: resolveCol(["founder score", "score", "rating", "abstract score", "founder_score"], CONFIG.COL.FOUNDER_SCORE),
    QUICK_THESIS: resolveCol(["quick thesis", "thesis", "raw take", "my take", "notes & user pointers", "notes and user pointers", "notes", "pointers"], CONFIG.COL.QUICK_THESIS),
    WHAT_WORKED: resolveCol(["what worked", "likes", "pros", "positives"], CONFIG.COL.WHAT_WORKED),
    WHAT_DIDNT: resolveCol(["what didnt", "what didn't", "dislikes", "cons", "negatives"], CONFIG.COL.WHAT_DIDNT),
    STATUS: resolveCol(["status", "editorial status", "generation status"], 7),
    GENERATED_JSON: resolveCol(["generated review / json", "generated review /json", "generated review/json", "generated review", "generated json", "review json", "generated_json", "json"], 8),
    FAVORITE_SCENE: resolveCol(["favorite scene", "favorite_scene"], CONFIG.COL.FAVORITE_SCENE),
    FAVORITE_QUOTE: resolveCol(["favorite quote", "favorite_quote"], CONFIG.COL.FAVORITE_QUOTE),
    VIEWING_NOTES: resolveCol(["viewing memory notes", "viewing notes", "notes & user pointers", "memory notes", "notes"], CONFIG.COL.VIEWING_NOTES),
    TARGET_LENGTH: resolveCol(["target review length", "target length", "length"], CONFIG.COL.TARGET_LENGTH),
    ORIGINAL_TITLE: resolveCol(["original title"], CONFIG.COL.ORIGINAL_TITLE),
    DIRECTOR: resolveCol(["director", "creator"], CONFIG.COL.DIRECTOR),
    LEAD_CAST: resolveCol(["lead cast", "cast"], CONFIG.COL.LEAD_CAST),
    RUNTIME: resolveCol(["runtime"], CONFIG.COL.RUNTIME),
    PRIMARY_GENRES: resolveCol(["primary genres", "genres"], CONFIG.COL.PRIMARY_GENRES),
    THEMES_MOODS: resolveCol(["themes & moods", "themes", "moods"], CONFIG.COL.THEMES_MOODS),
    GENERATION_STATUS: resolveCol(["generation status", "status"], CONFIG.COL.GENERATION_STATUS),
    GENERATED_PREVIEW: resolveCol(["generated review preview", "generated preview", "preview"], CONFIG.COL.GENERATED_PREVIEW),
    AI_NOTES: resolveCol(["ai generation notes", "ai notes", "automation notes"], CONFIG.COL.AI_NOTES),
    GENERATION_TIME: resolveCol(["generation timestamp", "generation time"], CONFIG.COL.GENERATION_TIME),
    EDITORIAL_STATUS: resolveCol(["editorial status", "status"], CONFIG.COL.EDITORIAL_STATUS),
    FOUNDER_NOTES: resolveCol(["founder review notes", "founder notes"], CONFIG.COL.FOUNDER_NOTES),
    FINAL_APPROVED_JSON: resolveCol(["final approved json", "approved json"], CONFIG.COL.FINAL_APPROVED_JSON),
    APPROVED_BY: resolveCol(["approved by"], CONFIG.COL.APPROVED_BY),
    APPROVAL_TIME: resolveCol(["approval timestamp", "approval time"], CONFIG.COL.APPROVAL_TIME),
    CMS_IMPORT_STATUS: resolveCol(["cms import status", "cms status"], CONFIG.COL.CMS_IMPORT_STATUS),
    WEBSITE_PUB_STATUS: resolveCol(["website publication status", "publication status"], CONFIG.COL.WEBSITE_PUB_STATUS),
    PUBLISHED_URL: resolveCol(["published url", "url"], CONFIG.COL.PUBLISHED_URL),
    PUB_TIME: resolveCol(["publication timestamp", "pub time"], CONFIG.COL.PUB_TIME),
    INTERNAL_ID: resolveCol(["internal id", "id"], CONFIG.COL.INTERNAL_ID),
    ERROR_LOG: resolveCol(["error log", "error", "errors"], CONFIG.COL.ERROR_LOG),
    LAST_UPDATED: resolveCol(["last updated", "updated"], CONFIG.COL.LAST_UPDATED),
  };
}

// ==============================================================================
// 3. SECURE PROPERTIES ACCESSORS (Script Properties)
// ==============================================================================
function getScriptConfig() {
  var props = PropertiesService.getScriptProperties();
  var rawSecret = (
    props.getProperty("AUTOMATION_SECRET") ||
    props.getProperty("GOOGLE_SHEETS_AUTOMATION_SECRET") ||
    props.getProperty("API_SECRET") ||
    ""
  ).trim();

  var rawApiBase = (
    props.getProperty("API_BASE_URL") ||
    props.getProperty("BACKEND_URL") ||
    "https://the-abstract-take.vercel.app"
  ).trim().replace(/\/$/, "");

  return {
    geminiApiKey: (props.getProperty("GEMINI_API_KEY") || "").trim(),
    apiBaseUrl: rawApiBase,
    automationSecret: rawSecret,
  };
}

function promptForApiKey() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    "🔑 Set Gemini API Key",
    "Enter your Google Gemini API Key. It will be securely stored in Script Properties:",
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    var key = result.getResponseText().trim();
    if (key) {
      PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", key);
      ui.alert("✅ Gemini API Key securely saved in Script Properties.");
    }
  }
}

function promptForBackendConfig() {
  var ui = SpreadsheetApp.getUi();
  var resUrl = ui.prompt(
    "🌐 Backend API Base URL",
    "Enter backend URL (default: https://the-abstract-take.vercel.app):",
    ui.ButtonSet.OK_CANCEL
  );

  if (resUrl.getSelectedButton() === ui.Button.OK) {
    var url = resUrl.getResponseText().trim();
    if (url) PropertiesService.getScriptProperties().setProperty("API_BASE_URL", url);
  }

  var resSecret = ui.prompt(
    "🔒 Automation Secret Key",
    "Enter the AUTOMATION_SECRET (must match the AUTOMATION_SECRET environment variable on Vercel/Next.js):",
    ui.ButtonSet.OK_CANCEL
  );

  if (resSecret.getSelectedButton() === ui.Button.OK) {
    var secret = resSecret.getResponseText().trim();
    if (secret) PropertiesService.getScriptProperties().setProperty("AUTOMATION_SECRET", secret);
  }

  ui.alert("✅ Backend configuration updated successfully.");
}

// ==============================================================================
// 4. CUSTOM MENU & UI
// ==============================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🎬 The Abstract Take")
    .addItem("✨ Generate Review for Selected Row", "generateReviewForActiveRow")
    .addItem("⚡ Generate Reviews for Ready Rows (Batch 3-5)", "generateApprovedRows")
    .addSeparator()
    .addItem("🔍 Validate Selected Review JSON", "validateSelectedReview")
    .addItem("📝 Mark Selected Row as 'Needs Review'", "markSelectedReadyForEditorial")
    .addItem("✅ Approve Selected Review", "approveSelectedReview")
    .addSeparator()
    .addItem("🚀 Import Approved Reviews to CMS (Drafts)", "importApprovedToCms")
    .addItem("📦 Export Approved Reviews JSON", "exportApprovedReviewsModal")
    .addSeparator()
    .addItem("📊 View Pipeline Status", "showPipelineStatus")
    .addItem("📋 Setup 34-Column Sheet Template", "setupSheetTemplate")
    .addSeparator()
    .addSubMenu(
      ui.createMenu("⚙️ Settings & Configuration")
        .addItem("🔑 Set Gemini API Key", "promptForApiKey")
        .addItem("🌐 Configure Backend Connection", "promptForBackendConfig")
        .addItem("🔌 Test Backend Connection", "testBackendConnection")
    )
    .addToUi();
}

// ==============================================================================
// 5. ROW VALIDATION & EXTRACTION
// ==============================================================================
function validateEditorialRow(row, cols) {
  var titleCol = (cols && cols.TITLE) ? cols.TITLE : 1;
  var scoreCol = (cols && cols.FOUNDER_SCORE) ? cols.FOUNDER_SCORE : 4;
  var typeCol = (cols && cols.CONTENT_TYPE) ? cols.CONTENT_TYPE : 3;

  var title = String(row[titleCol - 1] || "").trim();
  var score = Number(row[scoreCol - 1]);
  var rawType = String(row[typeCol - 1] || "").trim();

  if (!title) {
    return { valid: false, error: "Title is required (Column " + titleCol + ")." };
  }
  if (!score || isNaN(score) || score < 1 || score > 10) {
    return { valid: false, error: "Valid Founder Score (1–10) is required (Column " + scoreCol + ")." };
  }
  if (!rawType) {
    return { valid: false, error: "Content Type / Media Type is required (Column " + typeCol + ")." };
  }

  var normType = normalizeContentType(rawType);
  if (!normType) {
    return {
      valid: false,
      error: 'Invalid Content Type: "' + rawType + '". Must be one of: ' + CANONICAL_MEDIA_TYPES.join(", ") + '.',
    };
  }

  return { valid: true, normalizedType: normType };
}

function extractRowData(row, rowNum, cols) {
  function getVal(colIndex, defaultVal) {
    if (!colIndex || colIndex < 1 || colIndex > row.length) return defaultVal;
    var v = row[colIndex - 1];
    return (v !== undefined && v !== null) ? String(v).trim() : defaultVal;
  }

  var rawType = getVal(cols.CONTENT_TYPE, "Movie");
  var normalizedType = normalizeContentType(rawType) || rawType;
  var scoreNum = Number(getVal(cols.FOUNDER_SCORE, "8"));

  return {
    rowNumber: rowNum,
    title: getVal(cols.TITLE, ""),
    releaseYear: Number(getVal(cols.RELEASE_YEAR, String(new Date().getFullYear()))) || new Date().getFullYear(),
    contentType: normalizedType,
    founderScore: isNaN(scoreNum) ? 8 : scoreNum,
    quickThesis: getVal(cols.QUICK_THESIS, ""),
    whatWorked: getVal(cols.WHAT_WORKED, ""),
    whatDidnt: getVal(cols.WHAT_DIDNT, ""),
    favoriteScene: getVal(cols.FAVORITE_SCENE, ""),
    favoriteQuote: getVal(cols.FAVORITE_QUOTE, ""),
    viewingNotes: getVal(cols.VIEWING_NOTES, ""),
    targetLength: getVal(cols.TARGET_LENGTH, "Standard Take"),
    originalTitle: getVal(cols.ORIGINAL_TITLE, ""),
    director: getVal(cols.DIRECTOR, ""),
    leadCast: getVal(cols.LEAD_CAST, ""),
    runtime: getVal(cols.RUNTIME, ""),
    genres: getVal(cols.PRIMARY_GENRES, ""),
    themesMoods: getVal(cols.THEMES_MOODS, ""),
    internalId: getVal(cols.INTERNAL_ID, ""),
  };
}

// ==============================================================================
// 6. AI REVIEW GENERATION WORKER (ATOMIC 12-STEP SEQUENCE WITH RETRIES)
// ==============================================================================
function generateReviewForRow(rowNumber) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  var cols = getColumnMap(sheet);

  var maxCol = Math.max(sheet.getLastColumn(), 34);
  var rowValues = sheet.getRange(rowNumber, 1, 1, maxCol).getValues()[0];

  var validation = validateEditorialRow(rowValues, cols);
  if (!validation.valid) {
    logGenerationError(sheet, rowNumber, validation.error, cols);
    return { success: false, error: validation.error };
  }

  var rowData = extractRowData(rowValues, rowNumber, cols);

  // Set internal ID if empty and column exists
  if (cols.INTERNAL_ID && cols.INTERNAL_ID <= maxCol && !rowData.internalId) {
    var generatedId = "take-" + Date.now() + "-r" + rowNumber;
    sheet.getRange(rowNumber, cols.INTERNAL_ID).setValue(generatedId);
    rowData.internalId = generatedId;
  }

  // Mark Status as "Generating" (Status remains "Generating" during all retry attempts)
  var statusCol = cols.STATUS || cols.GENERATION_STATUS;
  if (statusCol && statusCol <= maxCol) {
    sheet.getRange(rowNumber, statusCol).setValue(CONFIG.STATUS.GENERATING);
  }
  if (cols.ERROR_LOG && cols.ERROR_LOG <= maxCol) {
    sheet.getRange(rowNumber, cols.ERROR_LOG).setValue("");
  }
  if (cols.LAST_UPDATED && cols.LAST_UPDATED <= maxCol) {
    sheet.getRange(rowNumber, cols.LAST_UPDATED).setValue(new Date().toISOString());
  }
  SpreadsheetApp.flush();

  try {
    var conf = getScriptConfig();
    var payload = {
      rowId: rowData.internalId,
      title: rowData.title,
      releaseYear: rowData.releaseYear,
      contentType: rowData.contentType,
      type: rowData.contentType,
      rating: rowData.founderScore,
      abstractScore: rowData.founderScore,
      rawTake: rowData.quickThesis,
      likes: rowData.whatWorked,
      dislikes: rowData.whatDidnt,
      favoriteScene: rowData.favoriteScene,
      favoriteQuote: rowData.favoriteQuote,
      memoryNotes: rowData.viewingNotes,
      targetLength: rowData.targetLength,
      originalTitle: rowData.originalTitle || undefined,
      director: rowData.director || undefined,
      cast: rowData.leadCast || undefined,
      runtime: rowData.runtime || undefined,
      genres: rowData.genres || undefined,
      themes: rowData.themesMoods || undefined,
    };

    // STEP 1-4: Generate via backend endpoint or direct Gemini (with automatic exponential backoff retries)
    var genResult = callGenerationApi(payload, conf);

    if (!genResult || !genResult.success) {
      throw new Error(genResult ? genResult.message || genResult.error : "Empty generation response from AI engine.");
    }

    // STEP 5: Parse JSON
    var rawParsed = null;
    if (genResult.generatedJson) {
      try {
        rawParsed = typeof genResult.generatedJson === "string" ? JSON.parse(genResult.generatedJson) : genResult.generatedJson;
      } catch (e) {
        throw new Error("Failed to parse generated JSON: " + e.message);
      }
    }
    if (!rawParsed && genResult.data) {
      rawParsed = genResult.data;
    }

    if (!rawParsed || typeof rawParsed !== "object") {
      throw new Error("AI returned unparseable or empty JSON review payload.");
    }

    // STEP 6: Validate required editorial fields
    var title = rawParsed.title || rowData.title;
    if (!title || !String(title).trim()) {
      throw new Error("Validation failed: Generated review missing required field 'title'.");
    }

    // STEP 7: Normalize canonical media type and shouldYouWatch
    var normType = normalizeContentType(rawParsed.type || rawParsed.contentType || rowData.contentType);
    if (!normType) {
      throw new Error('Post-generation validation failed: Unrecognized media type "' + (rawParsed.type || rawParsed.contentType) + '".');
    }
    rawParsed.type = normType;
    if (rawParsed.contentType) rawParsed.contentType = normType;

    rawParsed.shouldYouWatch = normalizeWatchVerdict(rawParsed.shouldYouWatch, rowData.founderScore);

    // STEP 8: Enforce generated.abstractScore === founderScore
    rawParsed.abstractScore = rowData.founderScore;
    rawParsed.scoreDescriptor = getScoreDescriptor(rowData.founderScore);

    rawParsed.title = title.trim();
    rawParsed.releaseYear = Number(rawParsed.releaseYear) || rowData.releaseYear;
    rawParsed.myTake = rawParsed.myTake || rawParsed.myTakeHook || rawParsed.headline || (rowData.title + " earns " + rowData.founderScore + "/10.");
    rawParsed.headline = rawParsed.headline || (rowData.title + ": A " + rawParsed.scoreDescriptor + " Critique");
    rawParsed.verdictText = rawParsed.verdictText || rawParsed.verdict || (rowData.title + " earns an official " + rowData.founderScore + "/10 on The Abstract Take.");
    rawParsed.pros = Array.isArray(rawParsed.pros) ? rawParsed.pros : [];
    rawParsed.cons = Array.isArray(rawParsed.cons) ? rawParsed.cons : [];
    rawParsed.longFormReview = rawParsed.longFormReview || rawParsed.editorialReview || "";
    if (!rawParsed.longFormReview || !rawParsed.longFormReview.trim()) {
      throw new Error("Validation failed: Generated review missing required field 'longFormReview'.");
    }

    rawParsed.recommendationMetadata = rawParsed.recommendationMetadata || {
      themes: ["Identity", "Human Nature"],
      moods: ["Atmospheric", "Thought-Provoking"],
    };
    rawParsed.generationMetadata = rawParsed.generationMetadata || {
      source: "editorial-memory-pipeline",
      founderScore: true,
      founderNotesProvided: true,
      requiresEditorialApproval: true,
      generatedAt: new Date().toISOString(),
    };

    // STEP 9: Serialize the validated JSON
    var jsonStr = JSON.stringify(rawParsed, null, 2);
    if (!jsonStr || typeof jsonStr !== "string" || jsonStr.trim().length === 0) {
      throw new Error("Validation failed: Serialized JSON string is empty.");
    }

    var preview = rawParsed.headline + "\n\n" + rawParsed.longFormReview + "\n\nVerdict: " + rawParsed.verdictText + " (" + rawParsed.shouldYouWatch + ")";
    var aiNotes = genResult.automationNotes || ("Generated via Editorial Memory Pipeline · Score: " + rowData.founderScore + "/10 (" + rawParsed.scoreDescriptor + ")");

    // STEP 10, 11, 12: Write to sheet, read back and verify non-empty, ONLY THEN update status to "Generated"
    writeGenerationResult(sheet, rowNumber, jsonStr, preview, aiNotes, rowData.founderScore, cols);

    return { success: true, title: rowData.title };
  } catch (err) {
    var errMsg = err.message || err.toString();
    logGenerationError(sheet, rowNumber, errMsg, cols);
    return { success: false, error: errMsg };
  }
}

/**
 * STEP 10, 11, 12: Writes JSON atomically and performs read-back verification before setting Status = Generated.
 */
function writeGenerationResult(sheet, rowNumber, jsonStr, preview, aiNotes, founderScore, cols) {
  // FINAL OUTPUT GUARD: Ensure generated JSON is non-empty string
  if (!jsonStr || typeof jsonStr !== "string" || jsonStr.trim().length === 0) {
    throw new Error("Output Guard Error: Cannot write empty JSON to sheet.");
  }

  if (!cols || !cols.GENERATED_JSON || cols.GENERATED_JSON < 1) {
    throw new Error("Target Column Resolution Error: 'Generated Review / JSON' column could not be found on sheet.");
  }

  var now = new Date().toISOString();

  // STEP 10: Write serialized JSON to the target Generated Review / JSON cell
  var jsonCell = sheet.getRange(rowNumber, cols.GENERATED_JSON);
  jsonCell.setValue(jsonStr);

  if (cols.GENERATED_PREVIEW && cols.GENERATED_PREVIEW !== cols.GENERATED_JSON) {
    sheet.getRange(rowNumber, cols.GENERATED_PREVIEW).setValue(preview);
  }
  if (cols.AI_NOTES && cols.AI_NOTES !== cols.GENERATED_JSON) {
    sheet.getRange(rowNumber, cols.AI_NOTES).setValue(aiNotes);
  }
  if (cols.GENERATION_TIME && cols.GENERATION_TIME !== cols.GENERATED_JSON) {
    sheet.getRange(rowNumber, cols.GENERATION_TIME).setValue(now);
  }

  // Force Google Sheets to write pending cell edits
  SpreadsheetApp.flush();

  // STEP 11: Immediately read back cell value and verify non-empty
  var readBackJson = String(jsonCell.getValue() || "").trim();
  if (!readBackJson || readBackJson.length === 0) {
    throw new Error("Write Verification Failed: 'Generated Review / JSON' cell (Row " + rowNumber + ", Col " + cols.GENERATED_JSON + ") is empty after write.");
  }

  // STEP 12: ONLY AFTER SUCCESSFUL WRITE VERIFICATION:
  // Advance Status to "Generated"
  var statusCol = cols.STATUS || cols.EDITORIAL_STATUS || cols.GENERATION_STATUS;
  if (statusCol) {
    sheet.getRange(rowNumber, statusCol).setValue(CONFIG.STATUS.GENERATED);
  }

  if (cols.ERROR_LOG && cols.ERROR_LOG !== cols.GENERATED_JSON) {
    sheet.getRange(rowNumber, cols.ERROR_LOG).setValue("");
  }
  if (cols.LAST_UPDATED && cols.LAST_UPDATED !== cols.GENERATED_JSON) {
    sheet.getRange(rowNumber, cols.LAST_UPDATED).setValue(now);
  }

  SpreadsheetApp.flush();
}

function logGenerationError(sheet, rowNumber, errorMsg, cols) {
  if (!sheet) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  }
  if (!cols) {
    cols = getColumnMap(sheet);
  }

  var now = new Date().toISOString();
  var statusCol = cols.STATUS || cols.GENERATION_STATUS || cols.EDITORIAL_STATUS;

  if (statusCol) {
    sheet.getRange(rowNumber, statusCol).setValue(CONFIG.STATUS.GENERATION_FAILED);
  }

  if (cols.ERROR_LOG && cols.ERROR_LOG !== cols.GENERATED_JSON) {
    sheet.getRange(rowNumber, cols.ERROR_LOG).setValue(errorMsg);
  }
  if (cols.LAST_UPDATED && cols.LAST_UPDATED !== cols.GENERATED_JSON) {
    sheet.getRange(rowNumber, cols.LAST_UPDATED).setValue(now);
  }

  SpreadsheetApp.flush();
}

// ==============================================================================
// 7. GENERATION API ROUTING & DIRECT GEMINI ENGINE WITH AUTOMATIC RETRIES
// ==============================================================================
function callGenerationApi(payload, conf) {
  // If backend endpoint is configured, try calling /api/automation/generate with retry
  if (conf.apiBaseUrl && conf.automationSecret) {
    var maxBackendAttempts = 4;
    var backendDelays = [2000, 5000, 10000];

    for (var bAttempt = 1; bAttempt <= maxBackendAttempts; bAttempt++) {
      try {
        var url = conf.apiBaseUrl + "/api/automation/generate";
        var options = {
          method: "post",
          headers: {
            "X-Automation-Secret": conf.automationSecret,
            "Content-Type": "application/json",
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true,
        };

        var response = UrlFetchApp.fetch(url, options);
        var code = response.getResponseCode();
        var body = response.getContentText();

        if (code === 200) {
          var parsedBody = JSON.parse(body);
          if (parsedBody && parsedBody.success) {
            return parsedBody;
          }
          throw new Error(parsedBody ? parsedBody.message || parsedBody.error : "Backend returned unparseable response");
        }

        var isRetryable = (code === 429 || code === 500 || code === 502 || code === 503 || code === 504);
        if (isRetryable && bAttempt < maxBackendAttempts) {
          var bWait = backendDelays[bAttempt - 1] || 10000;
          Logger.log("Backend temporary error (HTTP " + code + ") on attempt " + bAttempt + "/" + maxBackendAttempts + ". Retrying in " + (bWait / 1000) + "s...");
          Utilities.sleep(bWait);
          continue;
        }

        if (!conf.geminiApiKey) {
          if (!isRetryable) {
            throw new Error("Backend API Error (HTTP " + code + " Non-Retryable): " + body);
          } else {
            throw new Error("Backend API generation failed after " + maxBackendAttempts + " attempts (HTTP " + code + "): " + body);
          }
        }
        break; // If direct gemini api key is available, fall through to direct Gemini
      } catch (e) {
        if (!conf.geminiApiKey) throw e;
        Logger.log("Backend route failed, using direct Gemini API: " + e.toString());
        break;
      }
    }
  }

  // Direct Gemini fallback if GEMINI_API_KEY is configured in Script Properties
  if (conf.geminiApiKey) {
    return generateWithDirectGemini(payload, conf.geminiApiKey);
  }

  throw new Error("No AI generation engine configured. Please configure GEMINI_API_KEY in Script Properties.");
}

/**
 * Direct Gemini API Generator with Exponential Backoff Retry Handling
 * Preserves exact active endpoint: gemini-3.6-flash:generateContent
 */
function generateWithDirectGemini(payload, apiKey) {
  var score = Number(payload.rating || payload.abstractScore || 8);
  var quality = getScoreDescriptor(score);
  var type = normalizeContentType(payload.contentType || payload.type) || "Movie";

  var prompt = [
    'You are the lead editorial writing assistant for "The Abstract Take" film and television critique publication.',
    '',
    'PRIMARY DIRECTIVE:',
    'Translate the founder\'s raw viewing memories, personal reactions, and authoritative numerical rating into a rich, publication-ready critique.',
    '',
    'STRICT CONSTRAINTS (NON-NEGOTIABLE):',
    '1. STRICT SCORE AUTHORITY: The founder\'s score is ' + score + '/10 (' + quality + '). You MUST NOT change this score.',
    '2. STRICT MEDIA TYPE CONSTRAINT: "type" MUST be EXACTLY one of: "Movie", "Series", "Anime", "Documentary", "Mini Series", "Special". Specifically, "Mini Series" MUST have a single space and NO hyphen (never "Mini - Series" or "Mini-Series").',
    '3. STRICT SHOULD YOU WATCH CONSTRAINT: "shouldYouWatch" MUST be EXACTLY one of: "Must Watch", "Recommended", "For Fans", "Skip". NEVER output free-form sentences in shouldYouWatch.',
    '4. GROUNDED EDITORIAL SIGNALS: Extract and build upon the founder\'s provided reactions without inventing fabricated personal memories.',
    '5. TARGET LENGTH: ' + (payload.targetLength || 'Standard Take') + ' (~280 words).',
    '',
    'FOUNDER INPUTS:',
    '- TITLE: ' + payload.title + ' (' + payload.releaseYear + ')',
    '- MEDIA FORMAT: ' + type,
    '- AUTHORITATIVE SCORE: ' + score + '/10 (' + quality + ')',
    '- CORE THESIS: ' + (payload.rawTake || 'None provided'),
    '- WHAT WORKED: ' + (payload.likes || 'None provided'),
    '- WHAT DIDNT: ' + (payload.dislikes || 'None provided'),
    '- PERSONAL VERDICT: ' + (payload.personalVerdict || 'None provided'),
    '- MEMORY NOTES: ' + (payload.memoryNotes || 'None provided'),
    '',
    'OUTPUT FORMAT:',
    'Return ONLY a valid, parseable JSON object matching this schema:',
    '{',
    '  "title": "' + payload.title + '",',
    '  "releaseYear": ' + payload.releaseYear + ',',
    '  "type": "' + type + '",',
    '  "abstractScore": ' + score + ',',
    '  "scoreDescriptor": "' + quality + '",',
    '  "headline": "Compelling editorial headline",',
    '  "myTake": "1-2 sentence core thesis statement",',
    '  "pros": ["Strength 1", "Strength 2"],',
    '  "cons": ["Flaw 1"],',
    '  "verdictText": "Personal verdict statement",',
    '  "shouldYouWatch": "' + normalizeWatchVerdict(null, score) + '",',
    '  "longFormReview": "Structured critique in fluid paragraphs.",',
    '  "spoilerFreeTake": "Concise 1-2 sentence spoiler-free takeaway.",',
    '  "recommendationMetadata": { "themes": ["Theme1"], "moods": ["Mood1"] },',
    '  "generationMetadata": { "source": "editorial-memory-pipeline", "founderScore": true, "founderNotesProvided": true, "requiresEditorialApproval": true }',
    '}',
  ].join('\n');

  // Exact active endpoint preserved
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=' + apiKey;
  var requestPayload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(requestPayload),
    muteHttpExceptions: true,
  };

  var maxAttempts = CONFIG.RETRY.MAX_ATTEMPTS || 4;
  var retryDelays = CONFIG.RETRY.DELAYS_MS || [2000, 5000, 10000];
  var lastCode = 0;
  var lastErrorMsg = "";

  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    var response;
    var code;
    var text;

    try {
      response = UrlFetchApp.fetch(url, options);
      code = response.getResponseCode();
      text = response.getContentText();
    } catch (fetchErr) {
      // Network/transport timeout exception
      lastCode = 0;
      lastErrorMsg = fetchErr.message || fetchErr.toString();
      if (attempt < maxAttempts) {
        var waitMs = retryDelays[attempt - 1] || 10000;
        Logger.log("Gemini network error on attempt " + attempt + "/" + maxAttempts + ": " + lastErrorMsg + ". Retrying in " + (waitMs / 1000) + "s...");
        Utilities.sleep(waitMs);
        continue;
      } else {
        throw new Error("Gemini generation failed after " + maxAttempts + " attempts (Network/Transport Error): " + lastErrorMsg);
      }
    }

    if (code === 200) {
      var resJson;
      try {
        resJson = JSON.parse(text);
      } catch (parseEnvelopeErr) {
        throw new Error("Gemini API returned unparseable envelope JSON (HTTP 200): " + text);
      }

      if (!resJson || !resJson.candidates || !resJson.candidates.length) {
        throw new Error("Gemini API returned response with no candidates: " + text);
      }

      var candidate = resJson.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts.length) {
        throw new Error("Gemini candidate contains no content parts: " + JSON.stringify(candidate));
      }

      var candidateText = candidate.content.parts[0].text;
      if (!candidateText || !candidateText.trim()) {
        throw new Error("Gemini returned empty text output.");
      }

      var cleanJsonText = candidateText.trim();
      var jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJsonText = jsonMatch[0];
      }

      var parsed;
      try {
        parsed = JSON.parse(cleanJsonText);
      } catch (e) {
        throw new Error("Failed to parse Gemini output as JSON: " + e.message + "\nRaw text: " + candidateText);
      }

      return {
        success: true,
        generatedJson: JSON.stringify(parsed),
        data: parsed,
        automationNotes: "Generated via Gemini 3.6 Flash Direct API · Score: " + score + "/10 (" + quality + ")" + (attempt > 1 ? " (Attempt " + attempt + ")" : ""),
      };
    }

    // Check if error is retryable (429, 500, 502, 503, 504)
    lastCode = code;
    var parsedErrMsg = text;
    try {
      var errJson = JSON.parse(text);
      if (errJson && errJson.error && errJson.error.message) {
        parsedErrMsg = errJson.error.message;
      }
    } catch (e) {}
    lastErrorMsg = parsedErrMsg;

    var isRetryable = (code === 429 || code === 500 || code === 502 || code === 503 || code === 504);

    if (isRetryable && attempt < maxAttempts) {
      var waitMs = retryDelays[attempt - 1] || 10000;
      Logger.log("Gemini temporary error (HTTP " + code + ") on attempt " + attempt + "/" + maxAttempts + ": " + lastErrorMsg + ". Retrying in " + (waitMs / 1000) + "s...");
      Utilities.sleep(waitMs);
      continue;
    }

    // Non-retryable error (e.g. 400, 401, 403) or retries exhausted
    if (!isRetryable) {
      throw new Error("Gemini API Error (HTTP " + code + " Non-Retryable): " + lastErrorMsg);
    } else {
      throw new Error("Gemini generation failed after " + maxAttempts + " attempts (HTTP " + code + "): " + lastErrorMsg);
    }
  }

  throw new Error("Gemini generation failed after " + maxAttempts + " attempts (HTTP " + lastCode + "): " + lastErrorMsg);
}

// ==============================================================================
// 8. MENU ACTION HANDLERS
// ==============================================================================
function generateReviewForActiveRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var activeRow = sheet.getActiveCell().getRow();

  if (activeRow < 2) {
    SpreadsheetApp.getUi().alert("Please select a valid data row (row 2 or higher).");
    return;
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("Generating review for row " + activeRow + "...", "AI Generator", 3);
  var res = generateReviewForRow(activeRow);

  if (res.success) {
    SpreadsheetApp.getUi().alert("✅ Review generated successfully for \"" + res.title + "\"!\n\nStatus set to: Generated");
  } else {
    SpreadsheetApp.getUi().alert("❌ Generation failed for row " + activeRow + ":\n\n" + res.error);
  }
}

function generateApprovedRows() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    SpreadsheetApp.getUi().alert("Another automation batch is currently running. Please wait.");
    return;
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
    var cols = getColumnMap(sheet);
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    var statusColIdx = cols.STATUS || cols.GENERATION_STATUS || 7;
    var genStatusCol = sheet.getRange(2, statusColIdx, lastRow - 1, 1).getValues();
    var processedCount = 0;
    var successCount = 0;

    for (var i = 0; i < genStatusCol.length; i++) {
      if (processedCount >= CONFIG.MAX_BATCH_SIZE) break;

      var rawStatus = String(genStatusCol[i][0] || "").trim();
      var normStatus = normalizeWorkflowStatus(rawStatus);

      if (normStatus === CONFIG.STATUS.READY_FOR_GENERATION) {
        var rowNum = i + 2;
        processedCount++;
        var res = generateReviewForRow(rowNum);
        if (res.success) successCount++;
      }
    }

    if (processedCount === 0) {
      SpreadsheetApp.getUi().alert("No rows found with Status = 'Ready For Generation'.\n\nMark rows as 'Ready For Generation' to queue them.");
    } else {
      SpreadsheetApp.getUi().alert("⚡ Batch Complete:\n\nProcessed: " + processedCount + "\nSuccessful: " + successCount + "\nFailed: " + (processedCount - successCount));
    }
  } finally {
    lock.releaseLock();
  }
}

function markSelectedReadyForEditorial() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var cols = getColumnMap(sheet);
  var row = sheet.getActiveCell().getRow();
  if (row < 2) return;

  var statusCol = cols.STATUS || cols.EDITORIAL_STATUS || 7;
  sheet.getRange(row, statusCol).setValue(CONFIG.STATUS.NEEDS_REVIEW);
  if (cols.LAST_UPDATED) {
    sheet.getRange(row, cols.LAST_UPDATED).setValue(new Date().toISOString());
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("Marked row " + row + " as 'Needs Review'.", "Editorial Workflow", 3);
}

function approveSelectedReview() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var cols = getColumnMap(sheet);
  var row = sheet.getActiveCell().getRow();
  if (row < 2) return;

  var genJsonCol = cols.GENERATED_JSON || 8;
  var genJson = String(sheet.getRange(row, genJsonCol).getValue() || "").trim();
  if (!genJson) {
    SpreadsheetApp.getUi().alert("Cannot approve row " + row + ": No generated JSON exists in column " + genJsonCol + ".");
    return;
  }

  var now = new Date().toISOString();
  var statusCol = cols.STATUS || cols.EDITORIAL_STATUS || 7;
  sheet.getRange(row, statusCol).setValue(CONFIG.STATUS.APPROVED);

  if (cols.FINAL_APPROVED_JSON && cols.FINAL_APPROVED_JSON !== genJsonCol) {
    sheet.getRange(row, cols.FINAL_APPROVED_JSON).setValue(genJson);
  }
  if (cols.APPROVED_BY) {
    sheet.getRange(row, cols.APPROVED_BY).setValue("Founder / Chief Editor");
  }
  if (cols.APPROVAL_TIME) {
    sheet.getRange(row, cols.APPROVAL_TIME).setValue(now);
  }
  if (cols.LAST_UPDATED) {
    sheet.getRange(row, cols.LAST_UPDATED).setValue(now);
  }

  SpreadsheetApp.getUi().alert("✅ Review for row " + row + " approved!\n\nReady for CMS Draft Import.");
}

function validateSelectedReview() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var cols = getColumnMap(sheet);
  var row = sheet.getActiveCell().getRow();
  if (row < 2) return;

  var genJsonCol = cols.GENERATED_JSON || 8;
  var scoreCol = cols.FOUNDER_SCORE || 4;

  var genJson = String(sheet.getRange(row, genJsonCol).getValue() || "").trim();
  var expectedScore = Number(sheet.getRange(row, scoreCol).getValue());

  if (!genJson) {
    SpreadsheetApp.getUi().alert("No JSON found in column " + genJsonCol + " for row " + row + ".");
    return;
  }

  try {
    var parsed = JSON.parse(genJson);
    var score = parsed.abstractScore || parsed.score;
    var title = parsed.title;
    var type = parsed.type;
    var shouldYouWatch = parsed.shouldYouWatch;

    var issues = [];
    if (!title) issues.push("Missing title.");
    if (score !== expectedScore) issues.push("Score mismatch: JSON has " + score + ", founder set " + expectedScore + ".");
    if (!parsed.longFormReview && !parsed.editorialReview) issues.push("Missing review body.");

    // Media type validation
    if (!type || CANONICAL_MEDIA_TYPES.indexOf(type) === -1) {
      issues.push('Invalid MediaType "' + type + '". Must be exactly one of: ' + CANONICAL_MEDIA_TYPES.join(", "));
    }

    // Should You Watch validation
    if (!shouldYouWatch || CANONICAL_WATCH_VERDICTS.indexOf(shouldYouWatch) === -1) {
      issues.push('Invalid shouldYouWatch "' + shouldYouWatch + '". Must be exactly one of: ' + CANONICAL_WATCH_VERDICTS.join(", "));
    }

    if (issues.length === 0) {
      SpreadsheetApp.getUi().alert(
        "✅ Review JSON is valid!\n\n" +
        "Title: " + title + "\n" +
        "Score: " + score + "/10 (" + (parsed.scoreDescriptor || getScoreDescriptor(score)) + " - Verified Authority)\n" +
        "Format: " + type + " (Canonical)\n" +
        "Verdict: " + shouldYouWatch + " (Canonical)"
      );
    } else {
      SpreadsheetApp.getUi().alert("⚠️ Validation Issues Found:\n\n• " + issues.join("\n• "));
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ Malformed JSON syntax in row " + row + ":\n\n" + err.toString());
  }
}

// ==============================================================================
// 9. CMS IMPORT & EXPORT
// ==============================================================================
function importApprovedToCms() {
  var conf = getScriptConfig();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  var cols = getColumnMap(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // 1. Safety Check: Verify automation secret is configured before making network calls
  if (!conf.automationSecret) {
    SpreadsheetApp.getUi().alert(
      "⚠️ Missing Automation Secret Key\n\n" +
      "Google Apps Script requires an AUTOMATION_SECRET to authenticate CMS draft imports.\n\n" +
      "To configure:\n" +
      "1. Click: 🎬 The Abstract Take → ⚙️ Settings & Configuration → 🌐 Configure Backend Connection\n" +
      "2. Enter the AUTOMATION_SECRET matching your backend environment variable.\n\n" +
      "Alternatively, set 'AUTOMATION_SECRET' in Project Settings → Script Properties."
    );
    return;
  }

  var maxCol = Math.max(sheet.getLastColumn(), 34);
  var rows = sheet.getRange(2, 1, lastRow - 1, maxCol).getValues();
  var approvedPayloads = [];
  var rowNumbers = [];

  var statusCol = cols.STATUS || cols.EDITORIAL_STATUS || 7;
  var importStatusCol = cols.CMS_IMPORT_STATUS;
  var jsonCol = cols.FINAL_APPROVED_JSON || cols.GENERATED_JSON || 8;

    for (var i = 0; i < rows.length; i++) {
    var rawStatus = String(rows[i][statusCol - 1] || "").trim();
    var edStatus = normalizeWorkflowStatus(rawStatus);
    var importStatus = importStatusCol ? String(rows[i][importStatusCol - 1] || "").trim() : "";
    var approvedJson = String(rows[i][jsonCol - 1] || "").trim();

    if (edStatus === CONFIG.STATUS.APPROVED && importStatus !== "IMPORTED_TO_CMS" && approvedJson) {
      try {
        var parsed = JSON.parse(approvedJson);
        var rowSlug = (parsed.title || "item").toLowerCase().replace(/[^a-z0-9]/g, "");
        parsed.rowId = "sheet-row-" + (i + 2) + "-" + rowSlug;
        approvedPayloads.push(parsed);
        rowNumbers.push(i + 2);
      } catch (e) {
        Logger.log("Failed to parse JSON for row " + (i + 2) + ": " + e.toString());
      }
    }
  }

  if (approvedPayloads.length === 0) {
    SpreadsheetApp.getUi().alert("No unimported APPROVED reviews found.\n\nApprove reviews first (Status = 'Approved').");
    return;
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("Importing " + approvedPayloads.length + " review(s) to CMS Drafts...", "CMS Importer", 4);

  try {
    var url = conf.apiBaseUrl + "/api/admin/import-reviews";
    var options = {
      method: "post",
      headers: {
        "x-automation-secret": conf.automationSecret,
        "Content-Type": "application/json",
      },
      payload: JSON.stringify({ reviews: approvedPayloads, duplicateMode: "skip" }),
      muteHttpExceptions: true,
    };

    var res = UrlFetchApp.fetch(url, options);
    var code = res.getResponseCode();
    var bodyText = res.getContentText();

    if (code !== 200) {
      var errorDetail = bodyText;
      try {
        var errObj = JSON.parse(bodyText);
        if (errObj.message) {
          errorDetail = errObj.message;
        }
      } catch (e) {}

      if (code === 401) {
        throw new Error(
          "Authentication Rejected (HTTP 401):\n" +
          "The backend rejected the automation secret. Please verify that AUTOMATION_SECRET in Google Apps Script Settings matches the server environment variable."
        );
      } else if (code === 403) {
        throw new Error("Authorization Forbidden (HTTP 403):\n" + errorDetail);
      } else if (code === 400) {
        throw new Error("Import Validation Failed (HTTP 400):\n" + errorDetail);
      } else {
        throw new Error("Server Error (HTTP " + code + "):\n" + errorDetail);
      }
    }

    var resultJson;
    try {
      resultJson = JSON.parse(bodyText);
    } catch (parseErr) {
      throw new Error("Invalid CMS response format: " + bodyText);
    }

    var now = new Date().toISOString();
    var importedCount = 0;
    var skippedCount = 0;
    var failedCount = 0;
    var importedSummary = [];

    // Atomically match each submitted row individually against verified backend response
    for (var j = 0; j < approvedPayloads.length; j++) {
      var payload = approvedPayloads[j];
      var rNum = rowNumbers[j];
      var matchedImport = null;

      if (Array.isArray(resultJson.imported)) {
        for (var k = 0; k < resultJson.imported.length; k++) {
          var item = resultJson.imported[k];
          if (!item || !item.id || !item.slug) continue;

          var matchesRowId = Boolean(item.rowId && item.rowId === payload.rowId);
          var matchesTitle = Boolean(
            item.title && payload.title &&
            String(item.title).toLowerCase().trim() === String(payload.title).toLowerCase().trim() &&
            (payload.releaseYear ? Number(item.releaseYear) === Number(payload.releaseYear) : true)
          );

          if (matchesRowId || matchesTitle) {
            matchedImport = item;
            break;
          }
        }
      }

      if (matchedImport && matchedImport.id && matchedImport.slug) {
        // Confirmed verified persistence in CMS/database as DRAFT
        sheet.getRange(rNum, statusCol).setValue(CONFIG.STATUS.IMPORTED_TO_CMS);

        if (cols.CMS_IMPORT_STATUS) {
          sheet.getRange(rNum, cols.CMS_IMPORT_STATUS).setValue("IMPORTED_TO_CMS");
        }
        if (cols.WEBSITE_PUB_STATUS) {
          sheet.getRange(rNum, cols.WEBSITE_PUB_STATUS).setValue("DRAFT");
        }
        if (cols.INTERNAL_ID) {
          sheet.getRange(rNum, cols.INTERNAL_ID).setValue(matchedImport.id);
        }
        if (cols.PUBLISHED_URL) {
          sheet.getRange(rNum, cols.PUBLISHED_URL).setValue(conf.apiBaseUrl + "/reviews/" + matchedImport.slug);
        }
        if (cols.LAST_UPDATED) {
          sheet.getRange(rNum, cols.LAST_UPDATED).setValue(now);
        }

        importedCount++;
        importedSummary.push("• " + (matchedImport.title || payload.title) + " (CMS ID: " + matchedImport.id + ", slug: " + matchedImport.slug + ")");
      } else {
        // Check if skipped as duplicate or failed: LEAVE ROW IN 'Approved' STATUS
        var isDuplicate = false;
        if (Array.isArray(resultJson.skipped) || Array.isArray(resultJson.duplicates)) {
          var skipList = resultJson.skipped || resultJson.duplicates;
          isDuplicate = skipList.some(function(d) {
            return (d.rowId && d.rowId === payload.rowId) || (d.title && payload.title && d.title.toLowerCase().trim() === payload.title.toLowerCase().trim());
          });
        }

        if (isDuplicate) {
          skippedCount++;
          Logger.log("Row " + rNum + " ('" + payload.title + "') skipped as duplicate in CMS. Remains 'Approved'.");
        } else {
          failedCount++;
          Logger.log("Row " + rNum + " ('" + payload.title + "') failed CMS import. Remains 'Approved'.");
        }
      }
    }

    SpreadsheetApp.flush();

    if (importedCount > 0) {
      SpreadsheetApp.getUi().alert(
        "✅ CMS Draft Import Succeeded!\n\n" +
        "Imported to CMS: " + importedCount + " (Status set to: 'Imported to CMS')\n" +
        (skippedCount > 0 ? "Duplicates Skipped: " + skippedCount + " (Remain: 'Approved')\n" : "") +
        (failedCount > 0 ? "Failed: " + failedCount + " (Remain: 'Approved')\n" : "") + "\n" +
        "Verified Draft Records:\n" + importedSummary.join("\n") + "\n\n" +
        "The reviews are now securely stored as DRAFTS in the CMS.\n" +
        "Open the CMS Editorial Studio (/admin/reviews) to review and publish to the live website."
      );
    } else {
      SpreadsheetApp.getUi().alert(
        "⚠️ No Reviews Were Imported:\n\n" +
        (skippedCount > 0 ? "• " + skippedCount + " duplicate review(s) already exist in CMS.\n" : "") +
        (failedCount > 0 ? "• " + failedCount + " review(s) failed persistence validation.\n" : "") +
        "\nAll submitted rows remain safely in 'Approved' status."
      );
    }
  } catch (err) {
    // Failure Safety: Rows remain in "Approved" status if import fails
    SpreadsheetApp.getUi().alert("❌ CMS Import Failed:\n\n" + err.message);
  }
}

function exportApprovedReviewsModal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  var cols = getColumnMap(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var maxCol = Math.max(sheet.getLastColumn(), 34);
  var rows = sheet.getRange(2, 1, lastRow - 1, maxCol).getValues();
  var exportList = [];

  var statusCol = cols.STATUS || cols.EDITORIAL_STATUS || 7;
  var jsonCol = cols.FINAL_APPROVED_JSON || cols.GENERATED_JSON || 8;

  for (var i = 0; i < rows.length; i++) {
    var rawStatus = String(rows[i][statusCol - 1] || "").trim();
    var edStatus = normalizeWorkflowStatus(rawStatus);
    var jsonStr = String(rows[i][jsonCol - 1] || "").trim();

    if (edStatus === CONFIG.STATUS.APPROVED && jsonStr) {
      try {
        exportList.push(JSON.parse(jsonStr));
      } catch (e) {}
    }
  }

  var html = "<div style='font-family:monospace;padding:15px;'>" +
    "<h3>Approved Reviews JSON (" + exportList.length + " items)</h3>" +
    "<textarea style='width:100%;height:320px;font-size:11px;'>" +
    JSON.stringify(exportList, null, 2) +
    "</textarea></div>";

  var userInterface = HtmlService.createHtmlOutput(html).setWidth(600).setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(userInterface, "Export Approved Reviews");
}

function showPipelineStatus() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  var cols = getColumnMap(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("Sheet has no review rows.");
    return;
  }

  var maxCol = Math.max(sheet.getLastColumn(), 34);
  var rows = sheet.getRange(2, 1, lastRow - 1, maxCol).getValues();
  var counts = {
    total: rows.length,
    idea: 0,
    readyGen: 0,
    generating: 0,
    generated: 0,
    needsReview: 0,
    approved: 0,
    importedToCms: 0,
    published: 0,
    rewatch: 0,
    failed: 0,
  };

  var statusCol = cols.STATUS || cols.EDITORIAL_STATUS || 7;

  for (var i = 0; i < rows.length; i++) {
    var raw = String(rows[i][statusCol - 1] || "").trim();
    var st = normalizeWorkflowStatus(raw);

    if (st === CONFIG.STATUS.IDEA) counts.idea++;
    else if (st === CONFIG.STATUS.READY_FOR_GENERATION) counts.readyGen++;
    else if (st === CONFIG.STATUS.GENERATING) counts.generating++;
    else if (st === CONFIG.STATUS.GENERATED) counts.generated++;
    else if (st === CONFIG.STATUS.NEEDS_REVIEW) counts.needsReview++;
    else if (st === CONFIG.STATUS.APPROVED) counts.approved++;
    else if (st === CONFIG.STATUS.IMPORTED_TO_CMS) counts.importedToCms++;
    else if (st === CONFIG.STATUS.PUBLISHED) counts.published++;
    else if (st === CONFIG.STATUS.REWATCH_REQUIRED) counts.rewatch++;
    else if (st === CONFIG.STATUS.GENERATION_FAILED) counts.failed++;
    else if (raw) counts.idea++;
  }

  SpreadsheetApp.getUi().alert(
    "📊 The Abstract Take — Pipeline Status\n\n" +
    "Total Rows: " + counts.total + "\n\n" +
    "• Idea: " + counts.idea + "\n" +
    "• Ready For Generation: " + counts.readyGen + "\n" +
    "• Generating: " + counts.generating + "\n" +
    "• Generated: " + counts.generated + "\n" +
    "• Needs Review: " + counts.needsReview + "\n" +
    "• Approved: " + counts.approved + "\n" +
    "• Imported to CMS: " + counts.importedToCms + "\n" +
    "• Published: " + counts.published + "\n" +
    "• Rewatch Required: " + counts.rewatch + "\n" +
    "• Generation Failed: " + counts.failed
  );
}

function setupSheetTemplate() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  sheet.setName(CONFIG.SHEET_NAME);

  var headers = [
    // A–H: Canonical Primary Flow
    "Title", "Year", "Media Type", "Score", "Memory Confidence",
    "Notes & User Pointers", "Status", "Generated Review / JSON",
  ];

  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#0F172A"); // Slate-900
  headerRange.setFontColor("#F8FAFC");
  headerRange.setFontFamily("Consolas");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  var maxRows = Math.max(sheet.getMaxRows(), 300);

  // Content Type Dropdown (Col C / 3)
  var typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CANONICAL_MEDIA_TYPES, true)
    .build();
  sheet.getRange(2, 3, maxRows - 1, 1).setDataValidation(typeRule);

  // Score Dropdown (Col D / 4)
  var scoreRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"], true)
    .build();
  sheet.getRange(2, 4, maxRows - 1, 1).setDataValidation(scoreRule);

  // Status Dropdown (Col G / 7)
  var statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(CONFIG.CANONICAL_STATUS_LIST, true)
    .build();
  sheet.getRange(2, 7, maxRows - 1, 1).setDataValidation(statusRule);

  // Column Widths
  sheet.setColumnWidth(1, 180);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 70);
  sheet.setColumnWidth(5, 140);
  sheet.setColumnWidth(6, 260);
  sheet.setColumnWidth(7, 160);
  sheet.setColumnWidth(8, 360);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Editorial Pipeline Sheet Template successfully initialized with canonical dropdowns!",
    "Template Ready",
    5
  );
}

function testBackendConnection() {
  var conf = getScriptConfig();

  if (!conf.automationSecret) {
    SpreadsheetApp.getUi().alert(
      "⚠️ Missing Automation Secret Key\n\n" +
      "Google Apps Script requires an AUTOMATION_SECRET to authenticate with the backend.\n\n" +
      "To configure:\n" +
      "1. Click: 🎬 The Abstract Take → ⚙️ Settings & Configuration → 🌐 Configure Backend Connection\n" +
      "2. Enter your AUTOMATION_SECRET."
    );
    return;
  }

  var url = conf.apiBaseUrl + "/api/automation/health";
  var options = {
    method: "get",
    headers: {
      "x-automation-secret": conf.automationSecret,
      "Content-Type": "application/json",
    },
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var body = response.getContentText();

    if (code === 200) {
      SpreadsheetApp.getUi().alert(
        "✅ Backend Connection & Authentication Successful!\n\n" +
        "URL: " + conf.apiBaseUrl + "\n" +
        "Status: Authenticated (HTTP 200)\n\n" +
        "Ready to import approved reviews to CMS Drafts."
      );
    } else if (code === 401) {
      SpreadsheetApp.getUi().alert(
        "❌ Authentication Failed (HTTP 401)\n\n" +
        "The backend rejected the automation secret.\n\n" +
        "Ensure AUTOMATION_SECRET in Script Properties exactly matches the AUTOMATION_SECRET environment variable on Vercel."
      );
    } else {
      SpreadsheetApp.getUi().alert(
        "⚠️ Connection Issue (HTTP " + code + ")\n\n" +
        "Response: " + body
      );
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ Network Error:\n\n" + err.toString());
  }
}
