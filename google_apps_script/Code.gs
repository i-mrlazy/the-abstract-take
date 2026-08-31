/**
 * ==============================================================================
 * THE ABSTRACT TAKE — EDITORIAL MEMORY CAPTURE & BULK PIPELINE ENGINE (v5.3)
 * ==============================================================================
 * Google Apps Script for automated editorial memory capture, AI review generation,
 * score authority enforcement, controlled batching, and secure CMS draft import.
 *
 * ARCHITECTURE:
 * Google Sheet (34 Columns) → Google Apps Script → Gemini API / Backend → CMS Drafts
 *
 * EDITORIAL PRINCIPLES:
 * 1. STRICT SCORE AUTHORITY — Founder's Abstract Score (1–10) is absolute and never altered.
 * 2. EDITORIAL MEMORY SIGNALS — AI structures founder's notes without fabricating personal experiences.
 * 3. MANDATORY APPROVAL — Reviews must be approved by founder and imported as CMS drafts before publishing.
 * ==============================================================================
 */

// ==============================================================================
// 1. CONFIGURATION & COLUMN DEFINITIONS
// ==============================================================================
var CONFIG = {
  SHEET_NAME: "Editorial Pipeline",

  // 34-Column Index Map (1-indexed)
  COL: {
    // FOUNDER MEMORY / INPUT (A–K)
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

    // FACTUAL METADATA (L–Q)
    ORIGINAL_TITLE: 12,       // L
    DIRECTOR: 13,             // M
    LEAD_CAST: 14,            // N
    RUNTIME: 15,              // O
    PRIMARY_GENRES: 16,       // P
    THEMES_MOODS: 17,         // Q

    // AI GENERATION (R–V)
    GENERATION_STATUS: 18,    // R
    GENERATED_JSON: 19,       // S
    GENERATED_PREVIEW: 20,    // T
    AI_NOTES: 21,             // U
    GENERATION_TIME: 22,      // V

    // EDITORIAL REVIEW (W–AA)
    EDITORIAL_STATUS: 23,     // W
    FOUNDER_NOTES: 24,        // X
    FINAL_APPROVED_JSON: 25,  // Y
    APPROVED_BY: 26,          // Z
    APPROVAL_TIME: 27,        // AA

    // PUBLICATION (AB–AE)
    CMS_IMPORT_STATUS: 28,    // AB
    WEBSITE_PUB_STATUS: 29,   // AC
    PUBLISHED_URL: 30,        // AD
    PUB_TIME: 31,             // AE

    // SYSTEM (AF–AH)
    INTERNAL_ID: 32,          // AF
    ERROR_LOG: 33,            // AG
    LAST_UPDATED: 34,         // AH
  },

  // State Machine Values
  STATUS: {
    GENERATION: {
      NOT_STARTED: "NOT_STARTED",
      READY_FOR_GENERATION: "READY_FOR_GENERATION",
      GENERATING: "GENERATING",
      GENERATED: "GENERATED",
      GENERATION_FAILED: "GENERATION_FAILED",
    },
    EDITORIAL: {
      MEMORY_CAPTURE: "MEMORY_CAPTURE",
      AI_DRAFT_READY: "AI_DRAFT_READY",
      NEEDS_REVIEW: "NEEDS_REVIEW",
      NEEDS_REVISION: "NEEDS_REVISION",
      APPROVED: "APPROVED",
      REJECTED: "REJECTED",
    },
    CMS_IMPORT: {
      NOT_IMPORTED: "NOT_IMPORTED",
      IMPORTED_TO_CMS: "IMPORTED_TO_CMS",
      IMPORT_FAILED: "IMPORT_FAILED",
      DUPLICATE_SKIPPED: "DUPLICATE_SKIPPED",
    },
    WEBSITE_PUB: {
      DRAFT: "DRAFT",
      SCHEDULED: "SCHEDULED",
      PUBLISHED: "PUBLISHED",
    },
  },

  // Batch Generation Limits
  MAX_BATCH_SIZE: 5,
};

// ==============================================================================
// 2. SECURE PROPERTIES ACCESSORS (Script Properties)
// ==============================================================================
function getScriptConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    geminiApiKey: props.getProperty("GEMINI_API_KEY") || "",
    apiBaseUrl: (props.getProperty("API_BASE_URL") || "https://the-abstract-take.vercel.app").replace(/\/$/, ""),
    automationSecret: props.getProperty("AUTOMATION_SECRET") || "",
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
    "Enter backend URL (e.g. https://the-abstract-take.vercel.app or http://localhost:3000):",
    ui.ButtonSet.OK_CANCEL
  );

  if (resUrl.getSelectedButton() === ui.Button.OK) {
    var url = resUrl.getResponseText().trim();
    if (url) PropertiesService.getScriptProperties().setProperty("API_BASE_URL", url);
  }

  var resSecret = ui.prompt(
    "🔒 Automation Secret Key",
    "Enter the AUTOMATION_SECRET matching your backend environment variable:",
    ui.ButtonSet.OK_CANCEL
  );

  if (resSecret.getSelectedButton() === ui.Button.OK) {
    var secret = resSecret.getResponseText().trim();
    if (secret) PropertiesService.getScriptProperties().setProperty("AUTOMATION_SECRET", secret);
  }

  ui.alert("✅ Backend configuration updated successfully.");
}

// ==============================================================================
// 3. CUSTOM MENU & UI
// ==============================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🎬 The Abstract Take")
    .addItem("✨ Generate Review for Selected Row", "generateReviewForActiveRow")
    .addItem("⚡ Generate Reviews for Ready Rows (Batch 3-5)", "generateApprovedRows")
    .addSeparator()
    .addItem("🔍 Validate Selected Review JSON", "validateSelectedReview")
    .addItem("📝 Mark Selected Row Ready for Editorial Review", "markSelectedReadyForEditorial")
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
// 4. SETUP SHEET TEMPLATE (34 COLUMNS & DROPDOWNS)
// ==============================================================================
function setupSheetTemplate() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  sheet.setName(CONFIG.SHEET_NAME);

  var headers = [
    // A–K
    "TITLE", "RELEASE YEAR", "CONTENT TYPE", "FOUNDER SCORE", "QUICK THESIS",
    "WHAT WORKED", "WHAT DIDNT", "FAVORITE SCENE", "FAVORITE QUOTE",
    "VIEWING MEMORY NOTES", "TARGET REVIEW LENGTH",
    // L–Q
    "ORIGINAL TITLE", "DIRECTOR", "LEAD CAST", "RUNTIME", "PRIMARY GENRES", "THEMES & MOODS",
    // R–V
    "GENERATION STATUS", "GENERATED JSON", "GENERATED REVIEW PREVIEW",
    "AI GENERATION NOTES", "GENERATION TIMESTAMP",
    // W–AA
    "EDITORIAL STATUS", "FOUNDER REVIEW NOTES", "FINAL APPROVED JSON",
    "APPROVED BY", "APPROVAL TIMESTAMP",
    // AB–AE
    "CMS IMPORT STATUS", "WEBSITE PUBLICATION STATUS", "PUBLISHED URL", "PUBLICATION TIMESTAMP",
    // AF–AH
    "INTERNAL ID", "ERROR LOG", "LAST UPDATED",
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
    .requireValueInList(["Movie", "Series", "Mini Series", "Anime", "Documentary", "Special"], true)
    .build();
  sheet.getRange(2, CONFIG.COL.CONTENT_TYPE, maxRows - 1, 1).setDataValidation(typeRule);

  // Score Dropdown (Col D / 4)
  var scoreRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"], true)
    .build();
  sheet.getRange(2, CONFIG.COL.FOUNDER_SCORE, maxRows - 1, 1).setDataValidation(scoreRule);

  // Target Length Dropdown (Col K / 11)
  var lengthRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Quick Take", "Standard Take", "Deep Take", "Essay"], true)
    .build();
  sheet.getRange(2, CONFIG.COL.TARGET_LENGTH, maxRows - 1, 1).setDataValidation(lengthRule);

  // Generation Status Dropdown (Col R / 18)
  var genStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      CONFIG.STATUS.GENERATION.NOT_STARTED,
      CONFIG.STATUS.GENERATION.READY_FOR_GENERATION,
      CONFIG.STATUS.GENERATION.GENERATING,
      CONFIG.STATUS.GENERATION.GENERATED,
      CONFIG.STATUS.GENERATION.GENERATION_FAILED,
    ], true)
    .build();
  sheet.getRange(2, CONFIG.COL.GENERATION_STATUS, maxRows - 1, 1).setDataValidation(genStatusRule);

  // Editorial Status Dropdown (Col W / 23)
  var edStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      CONFIG.STATUS.EDITORIAL.MEMORY_CAPTURE,
      CONFIG.STATUS.EDITORIAL.AI_DRAFT_READY,
      CONFIG.STATUS.EDITORIAL.NEEDS_REVIEW,
      CONFIG.STATUS.EDITORIAL.NEEDS_REVISION,
      CONFIG.STATUS.EDITORIAL.APPROVED,
      CONFIG.STATUS.EDITORIAL.REJECTED,
    ], true)
    .build();
  sheet.getRange(2, CONFIG.COL.EDITORIAL_STATUS, maxRows - 1, 1).setDataValidation(edStatusRule);

  // CMS Import Status Dropdown (Col AB / 28)
  var importStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      CONFIG.STATUS.CMS_IMPORT.NOT_IMPORTED,
      CONFIG.STATUS.CMS_IMPORT.IMPORTED_TO_CMS,
      CONFIG.STATUS.CMS_IMPORT.IMPORT_FAILED,
      CONFIG.STATUS.CMS_IMPORT.DUPLICATE_SKIPPED,
    ], true)
    .build();
  sheet.getRange(2, CONFIG.COL.CMS_IMPORT_STATUS, maxRows - 1, 1).setDataValidation(importStatusRule);

  // Column Widths
  sheet.setColumnWidth(CONFIG.COL.TITLE, 180);
  sheet.setColumnWidth(CONFIG.COL.QUICK_THESIS, 240);
  sheet.setColumnWidth(CONFIG.COL.WHAT_WORKED, 200);
  sheet.setColumnWidth(CONFIG.COL.WHAT_DIDNT, 200);
  sheet.setColumnWidth(CONFIG.COL.VIEWING_NOTES, 260);
  sheet.setColumnWidth(CONFIG.COL.GENERATED_PREVIEW, 320);
  sheet.setColumnWidth(CONFIG.COL.GENERATED_JSON, 160);
  sheet.setColumnWidth(CONFIG.COL.ERROR_LOG, 220);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "34-Column Editorial Pipeline Template successfully initialized!",
    "Template Ready",
    5
  );
}

// ==============================================================================
// 5. ROW VALIDATION & EXTRACTION
// ==============================================================================
function validateEditorialRow(row) {
  var title = String(row[CONFIG.COL.TITLE - 1] || "").trim();
  var score = Number(row[CONFIG.COL.FOUNDER_SCORE - 1]);

  if (!title) {
    return { valid: false, error: "Title is required (Column A)." };
  }
  if (!score || isNaN(score) || score < 1 || score > 10) {
    return { valid: false, error: "Valid Founder Score (1–10) is required (Column D)." };
  }

  return { valid: true };
}

function extractRowData(row, rowNum) {
  return {
    rowNumber: rowNum,
    title: String(row[CONFIG.COL.TITLE - 1] || "").trim(),
    releaseYear: Number(row[CONFIG.COL.RELEASE_YEAR - 1]) || new Date().getFullYear(),
    contentType: String(row[CONFIG.COL.CONTENT_TYPE - 1] || "Movie").trim(),
    founderScore: Number(row[CONFIG.COL.FOUNDER_SCORE - 1]),
    quickThesis: String(row[CONFIG.COL.QUICK_THESIS - 1] || "").trim(),
    whatWorked: String(row[CONFIG.COL.WHAT_WORKED - 1] || "").trim(),
    whatDidnt: String(row[CONFIG.COL.WHAT_DIDNT - 1] || "").trim(),
    favoriteScene: String(row[CONFIG.COL.FAVORITE_SCENE - 1] || "").trim(),
    favoriteQuote: String(row[CONFIG.COL.FAVORITE_QUOTE - 1] || "").trim(),
    viewingNotes: String(row[CONFIG.COL.VIEWING_NOTES - 1] || "").trim(),
    targetLength: String(row[CONFIG.COL.TARGET_LENGTH - 1] || "Standard Take").trim(),
    originalTitle: String(row[CONFIG.COL.ORIGINAL_TITLE - 1] || "").trim(),
    director: String(row[CONFIG.COL.DIRECTOR - 1] || "").trim(),
    leadCast: String(row[CONFIG.COL.LEAD_CAST - 1] || "").trim(),
    runtime: String(row[CONFIG.COL.RUNTIME - 1] || "").trim(),
    genres: String(row[CONFIG.COL.PRIMARY_GENRES - 1] || "").trim(),
    themesMoods: String(row[CONFIG.COL.THEMES_MOODS - 1] || "").trim(),
    internalId: String(row[CONFIG.COL.INTERNAL_ID - 1] || "").trim(),
  };
}

// ==============================================================================
// 6. AI REVIEW GENERATION WORKER
// ==============================================================================
function generateReviewForRow(rowNumber) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  var rowValues = sheet.getRange(rowNumber, 1, 1, 34).getValues()[0];

  var validation = validateEditorialRow(rowValues);
  if (!validation.valid) {
    logGenerationError(rowNumber, validation.error);
    return { success: false, error: validation.error };
  }

  var rowData = extractRowData(rowValues, rowNumber);

  // Set internal ID if empty
  if (!rowData.internalId) {
    var generatedId = "take-" + Date.now() + "-r" + rowNumber;
    sheet.getRange(rowNumber, CONFIG.COL.INTERNAL_ID).setValue(generatedId);
    rowData.internalId = generatedId;
  }

  // Mark GENERATING status
  sheet.getRange(rowNumber, CONFIG.COL.GENERATION_STATUS).setValue(CONFIG.STATUS.GENERATION.GENERATING);
  sheet.getRange(rowNumber, CONFIG.COL.ERROR_LOG).setValue("");
  sheet.getRange(rowNumber, CONFIG.COL.LAST_UPDATED).setValue(new Date().toISOString());
  SpreadsheetApp.flush();

  try {
    var conf = getScriptConfig();
    var payload = {
      rowId: rowData.internalId,
      title: rowData.title,
      releaseYear: rowData.releaseYear,
      contentType: rowData.contentType,
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

    // Generate via backend endpoint or direct Gemini
    var genResult = callGenerationApi(payload, conf);

    if (!genResult || !genResult.success) {
      throw new Error(genResult ? genResult.message || genResult.error : "Empty generation response");
    }

    var jsonStr = genResult.generatedJson || JSON.stringify(genResult.data || {});
    var preview = genResult.generatedPreview || (genResult.data ? genResult.data.editorialReview : "");
    var aiNotes = genResult.automationNotes || "Generated via Editorial Memory Pipeline";

    // Write result to sheet
    writeGenerationResult(rowNumber, jsonStr, preview, aiNotes, rowData.founderScore);
    return { success: true, title: rowData.title };
  } catch (err) {
    var errMsg = err.toString();
    logGenerationError(rowNumber, errMsg);
    return { success: false, error: errMsg };
  }
}

function writeGenerationResult(rowNumber, jsonStr, preview, aiNotes, founderScore) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  var now = new Date().toISOString();

  sheet.getRange(rowNumber, CONFIG.COL.GENERATION_STATUS).setValue(CONFIG.STATUS.GENERATION.GENERATED);
  sheet.getRange(rowNumber, CONFIG.COL.GENERATED_JSON).setValue(jsonStr);
  sheet.getRange(rowNumber, CONFIG.COL.GENERATED_REVIEW_PREVIEW || CONFIG.COL.GENERATED_PREVIEW).setValue(preview);
  sheet.getRange(rowNumber, CONFIG.COL.AI_NOTES).setValue(aiNotes);
  sheet.getRange(rowNumber, CONFIG.COL.GENERATION_TIME).setValue(now);

  // Set Editorial Status to AI_DRAFT_READY (Mandatory approval step)
  sheet.getRange(rowNumber, CONFIG.COL.EDITORIAL_STATUS).setValue(CONFIG.STATUS.EDITORIAL.AI_DRAFT_READY);
  sheet.getRange(rowNumber, CONFIG.COL.ERROR_LOG).setValue("");
  sheet.getRange(rowNumber, CONFIG.COL.LAST_UPDATED).setValue(now);
}

function logGenerationError(rowNumber, errorMsg) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  sheet.getRange(rowNumber, CONFIG.COL.GENERATION_STATUS).setValue(CONFIG.STATUS.GENERATION.GENERATION_FAILED);
  sheet.getRange(rowNumber, CONFIG.COL.ERROR_LOG).setValue(errorMsg);
  sheet.getRange(rowNumber, CONFIG.COL.LAST_UPDATED).setValue(new Date().toISOString());
}

// ==============================================================================
// 7. GENERATION API ROUTING
// ==============================================================================
function callGenerationApi(payload, conf) {
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

  if (code !== 200) {
    throw new Error("HTTP " + code + ": " + body);
  }

  return JSON.parse(body);
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
    SpreadsheetApp.getUi().alert("✅ Review generated successfully for \"" + res.title + "\"!\n\nEditorial Status set to: AI_DRAFT_READY");
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
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    var genStatusCol = sheet.getRange(2, CONFIG.COL.GENERATION_STATUS, lastRow - 1, 1).getValues();
    var processedCount = 0;
    var successCount = 0;

    for (var i = 0; i < genStatusCol.length; i++) {
      if (processedCount >= CONFIG.MAX_BATCH_SIZE) break;

      var status = String(genStatusCol[i][0] || "").trim();
      if (status === CONFIG.STATUS.GENERATION.READY_FOR_GENERATION) {
        var rowNum = i + 2;
        processedCount++;
        var res = generateReviewForRow(rowNum);
        if (res.success) successCount++;
      }
    }

    if (processedCount === 0) {
      SpreadsheetApp.getUi().alert("No rows found with Generation Status = 'READY_FOR_GENERATION'.\n\nMark rows as READY_FOR_GENERATION to queue them.");
    } else {
      SpreadsheetApp.getUi().alert("⚡ Batch Complete:\n\nProcessed: " + processedCount + "\nSuccessful: " + successCount + "\nFailed: " + (processedCount - successCount));
    }
  } finally {
    lock.releaseLock();
  }
}

function markSelectedReadyForEditorial() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveCell().getRow();
  if (row < 2) return;

  sheet.getRange(row, CONFIG.COL.EDITORIAL_STATUS).setValue(CONFIG.STATUS.EDITORIAL.NEEDS_REVIEW);
  sheet.getRange(row, CONFIG.COL.LAST_UPDATED).setValue(new Date().toISOString());
  SpreadsheetApp.getActiveSpreadsheet().toast("Marked row " + row + " as NEEDS_REVIEW.", "Editorial Workflow", 3);
}

function approveSelectedReview() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveCell().getRow();
  if (row < 2) return;

  var genJson = String(sheet.getRange(row, CONFIG.COL.GENERATED_JSON).getValue() || "").trim();
  if (!genJson) {
    SpreadsheetApp.getUi().alert("Cannot approve row " + row + ": No generated JSON exists.");
    return;
  }

  var now = new Date().toISOString();
  sheet.getRange(row, CONFIG.COL.EDITORIAL_STATUS).setValue(CONFIG.STATUS.EDITORIAL.APPROVED);
  sheet.getRange(row, CONFIG.COL.FINAL_APPROVED_JSON).setValue(genJson);
  sheet.getRange(row, CONFIG.COL.APPROVED_BY).setValue("Founder / Chief Editor");
  sheet.getRange(row, CONFIG.COL.APPROVAL_TIME).setValue(now);
  sheet.getRange(row, CONFIG.COL.LAST_UPDATED).setValue(now);

  SpreadsheetApp.getUi().alert("✅ Review for row " + row + " approved!\n\nReady for CMS Draft Import.");
}

function validateSelectedReview() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var row = sheet.getActiveCell().getRow();
  if (row < 2) return;

  var genJson = String(sheet.getRange(row, CONFIG.COL.GENERATED_JSON).getValue() || "").trim();
  var expectedScore = Number(sheet.getRange(row, CONFIG.COL.FOUNDER_SCORE).getValue());

  if (!genJson) {
    SpreadsheetApp.getUi().alert("No JSON to validate for row " + row + ".");
    return;
  }

  try {
    var parsed = JSON.parse(genJson);
    var score = parsed.abstractScore || parsed.score;
    var title = parsed.title;

    var issues = [];
    if (!title) issues.push("Missing title.");
    if (score !== expectedScore) issues.push("Score mismatch: JSON has " + score + ", founder set " + expectedScore + ".");
    if (!parsed.longFormReview && !parsed.editorialReview) issues.push("Missing review body.");

    if (issues.length === 0) {
      SpreadsheetApp.getUi().alert("✅ Review JSON is valid!\n\nTitle: " + title + "\nScore: " + score + "/10 (Verified Authority)\nFormat: " + parsed.type);
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
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var rows = sheet.getRange(2, 1, lastRow - 1, 34).getValues();
  var approvedPayloads = [];
  var rowNumbers = [];

  for (var i = 0; i < rows.length; i++) {
    var edStatus = String(rows[i][CONFIG.COL.EDITORIAL_STATUS - 1] || "").trim();
    var importStatus = String(rows[i][CONFIG.COL.CMS_IMPORT_STATUS - 1] || "").trim();
    var approvedJson = String(rows[i][CONFIG.COL.FINAL_APPROVED_JSON - 1] || rows[i][CONFIG.COL.GENERATED_JSON - 1] || "").trim();

    if (edStatus === CONFIG.STATUS.EDITORIAL.APPROVED && importStatus !== CONFIG.STATUS.CMS_IMPORT.IMPORTED_TO_CMS && approvedJson) {
      try {
        var parsed = JSON.parse(approvedJson);
        parsed.rowId = "sheet-row-" + (i + 2);
        approvedPayloads.push(parsed);
        rowNumbers.push(i + 2);
      } catch (e) {}
    }
  }

  if (approvedPayloads.length === 0) {
    SpreadsheetApp.getUi().alert("No unimported APPROVED reviews found.\n\nApprove reviews first (Editorial Status = 'APPROVED').");
    return;
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("Importing " + approvedPayloads.length + " review(s) to CMS Drafts...", "CMS Importer", 4);

  try {
    var url = conf.apiBaseUrl + "/api/admin/import-reviews";
    var options = {
      method: "post",
      headers: {
        "X-Automation-Secret": conf.automationSecret,
        "Content-Type": "application/json",
      },
      payload: JSON.stringify({ reviews: approvedPayloads, duplicateMode: "skip" }),
      muteHttpExceptions: true,
    };

    var res = UrlFetchApp.fetch(url, options);
    var code = res.getResponseCode();
    var bodyText = res.getContentText();

    if (code !== 200) {
      throw new Error("HTTP " + code + ": " + bodyText);
    }

    var resultJson = JSON.parse(bodyText);
    var now = new Date().toISOString();

    for (var j = 0; j < rowNumbers.length; j++) {
      var rNum = rowNumbers[j];
      sheet.getRange(rNum, CONFIG.COL.CMS_IMPORT_STATUS).setValue(CONFIG.STATUS.CMS_IMPORT.IMPORTED_TO_CMS);
      sheet.getRange(rNum, CONFIG.COL.WEBSITE_PUB_STATUS).setValue(CONFIG.STATUS.WEBSITE_PUB.DRAFT);
      sheet.getRange(rNum, CONFIG.COL.PUB_TIME).setValue(now);
      sheet.getRange(rNum, CONFIG.COL.LAST_UPDATED).setValue(now);
    }

    SpreadsheetApp.getUi().alert(
      "✅ CMS Draft Import Succeeded!\n\n" +
      "Imported to CMS: " + resultJson.importedCount + " (Saved as DRAFTS)\n" +
      "Duplicates Skipped: " + resultJson.skippedCount + "\n\n" +
      "The founder can now review and publish these takes directly in the CMS Editor."
    );
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ CMS Import Failed:\n\n" + err.toString());
  }
}

function exportApprovedReviewsModal() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  var rows = sheet.getRange(2, 1, lastRow - 1, 34).getValues();
  var exportList = [];

  for (var i = 0; i < rows.length; i++) {
    var edStatus = String(rows[i][CONFIG.COL.EDITORIAL_STATUS - 1] || "").trim();
    var jsonStr = String(rows[i][CONFIG.COL.FINAL_APPROVED_JSON - 1] || rows[i][CONFIG.COL.GENERATED_JSON - 1] || "").trim();

    if (edStatus === CONFIG.STATUS.EDITORIAL.APPROVED && jsonStr) {
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
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("Sheet has no review rows.");
    return;
  }

  var rows = sheet.getRange(2, 1, lastRow - 1, 34).getValues();
  var counts = {
    total: rows.length,
    readyGen: 0,
    generated: 0,
    draftReady: 0,
    approved: 0,
    imported: 0,
    failed: 0,
  };

  for (var i = 0; i < rows.length; i++) {
    var gen = String(rows[i][CONFIG.COL.GENERATION_STATUS - 1] || "").trim();
    var ed = String(rows[i][CONFIG.COL.EDITORIAL_STATUS - 1] || "").trim();
    var imp = String(rows[i][CONFIG.COL.CMS_IMPORT_STATUS - 1] || "").trim();

    if (gen === CONFIG.STATUS.GENERATION.READY_FOR_GENERATION) counts.readyGen++;
    if (gen === CONFIG.STATUS.GENERATION.GENERATED) counts.generated++;
    if (gen === CONFIG.STATUS.GENERATION.GENERATION_FAILED) counts.failed++;
    if (ed === CONFIG.STATUS.EDITORIAL.AI_DRAFT_READY) counts.draftReady++;
    if (ed === CONFIG.STATUS.EDITORIAL.APPROVED) counts.approved++;
    if (imp === CONFIG.STATUS.CMS_IMPORT.IMPORTED_TO_CMS) counts.imported++;
  }

  SpreadsheetApp.getUi().alert(
    "📊 The Abstract Take — Pipeline Status\n\n" +
    "Total Rows: " + counts.total + "\n\n" +
    "• Ready for Generation: " + counts.readyGen + "\n" +
    "• AI Generated: " + counts.generated + "\n" +
    "• Awaiting Editorial Review: " + counts.draftReady + "\n" +
    "• Founder Approved: " + counts.approved + "\n" +
    "• Imported to CMS (Drafts): " + counts.imported + "\n" +
    "• Generation Failed / Errors: " + counts.failed
  );
}

function testBackendConnection() {
  var conf = getScriptConfig();
  var url = conf.apiBaseUrl + "/api/automation/health";
  var options = {
    method: "get",
    headers: {
      "X-Automation-Secret": conf.automationSecret,
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
        "✅ Backend Connection Successful!\n\n" +
        "URL: " + conf.apiBaseUrl + "\n" +
        "Response: " + body
      );
    } else {
      SpreadsheetApp.getUi().alert(
        "⚠️ Authentication / Connection Issue (HTTP " + code + ")\n\n" +
        "Response: " + body + "\n\n" +
        "Check that AUTOMATION_SECRET in Script Properties matches backend environment variables."
      );
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert("❌ Network Error:\n\n" + err.toString());
  }
}
