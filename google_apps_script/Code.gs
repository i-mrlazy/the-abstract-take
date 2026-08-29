/**
 * ==============================================================================
 * THE ABSTRACT TAKE — BULK EDITORIAL AUTOMATION ENGINE
 * ==============================================================================
 * Google Apps Script for automated bulk review generation & publishing.
 *
 * ARCHITECTURE:
 * Google Sheet → Google Apps Script → Gemini API / Backend API → The Abstract Take DB
 *
 * EDITORIAL HIERARCHY:
 * 1. CREATOR OPINION — Absolute authority (Rating, Raw Notes, Likes, Dislikes).
 * 2. VERIFIED FACTUAL INFORMATION.
 * 3. CONTEXTUAL BACKGROUND — Optional, never presented as creator opinion.
 * ==============================================================================
 */

// ==============================================================================
// CONFIGURATION
// ==============================================================================
var CONFIG = {
  // The Abstract Take backend API base URL
  // For local development with ngrok or live production server:
  // e.g. "https://theabstracttake.com" or "https://your-tunnel.ngrok-free.app" or "http://localhost:3000"
  API_BASE_URL: "http://localhost:3000",

  // Must match AUTOMATION_SECRET in your backend environment variables
  AUTOMATION_SECRET: "your-google-sheets-automation-secret-key",

  // (Optional) Gemini API Key if you wish to call Gemini directly from Apps Script
  // If empty, Apps Script routes generation through the secure backend endpoint.
  GEMINI_API_KEY: "",

  // Sheet Name containing reviews
  SHEET_NAME: "Reviews Backlog",

  // Column Index Map (1-based index)
  COL: {
    TITLE: 1,
    RELEASE_YEAR: 2,
    CONTENT_TYPE: 3,
    EXTERNAL_ID: 4,
    RATING: 5,
    MY_RAW_TAKE: 6,
    THINGS_LIKED: 7,
    THINGS_DISLIKED: 8,
    PERSONAL_VERDICT: 9,
    ADDITIONAL_NOTES: 10,
    GENERATED_HEADLINE: 11,
    GENERATED_REVIEW: 12,
    GENERATED_PROS: 13,
    GENERATED_CONS: 14,
    GENERATED_VERDICT: 15,
    GENERATED_SEO_DESC: 16,
    GENERATED_TAGS: 17,
    STATUS: 18,
    PUBLISHED_URL: 19,
    LAST_PROCESSED: 20,
    AUTOMATION_NOTES: 21,
  },

  // Authoritative Status Values
  STATUS_VALUES: {
    PENDING: "Pending",
    REVIEW_GENERATED: "Review generated",
    PUBLISH_IT: "Publish it",
    PUBLISHED: "Published",
  },
};

// ==============================================================================
// CUSTOM MENU & UI
// ==============================================================================
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🎬 The Abstract Take")
    .addItem("⚡ Run Full Automation Cycle", "runFullCycle")
    .addSeparator()
    .addItem("📝 Step 1: Process Pending Reviews", "processPendingReviews")
    .addItem("🚀 Step 2: Publish Approved Reviews", "publishApprovedReviews")
    .addSeparator()
    .addItem("🔍 Test Backend Connection", "testBackendConnection")
    .addItem("📋 Setup Sheet Headers & Validation", "setupSheetTemplate")
    .addSeparator()
    .addItem("⏰ Install Automatic 5-Min Trigger", "installAutomationTriggers")
    .addItem("🛑 Remove Automatic Triggers", "removeAutomationTriggers")
    .addToUi();
}

// ==============================================================================
// 1. SETUP SHEET HEADERS, STYLES & DROPDOWNS
// ==============================================================================
function setupSheetTemplate() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
  sheet.setName(CONFIG.SHEET_NAME);

  var headers = [
    "TITLE",
    "RELEASE YEAR",
    "CONTENT TYPE",
    "EXTERNAL MEDIA ID",
    "RATING",
    "MY RAW TAKE",
    "THINGS I LIKED",
    "THINGS I DIDN'T LIKE",
    "PERSONAL VERDICT",
    "ADDITIONAL NOTES",
    "GENERATED HEADLINE",
    "GENERATED REVIEW",
    "GENERATED PROS",
    "GENERATED CONS",
    "GENERATED VERDICT",
    "GENERATED SEO DESCRIPTION",
    "GENERATED TAGS",
    "STATUS",
    "PUBLISHED URL",
    "LAST PROCESSED",
    "AUTOMATION NOTES",
  ];

  // Set Header Row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#111827"); // Dark Slate
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontFamily("Consolas");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  // Set Status Dropdown Validation on Column R (Col 18)
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      CONFIG.STATUS_VALUES.PENDING,
      CONFIG.STATUS_VALUES.REVIEW_GENERATED,
      CONFIG.STATUS_VALUES.PUBLISH_IT,
      CONFIG.STATUS_VALUES.PUBLISHED,
    ], true)
    .setAllowInvalid(false)
    .build();

  var maxRows = Math.max(sheet.getMaxRows(), 500);
  sheet.getRange(2, CONFIG.COL.STATUS, maxRows - 1, 1).setDataValidation(rule);

  // Set Content Type Dropdown on Column C (Col 3)
  var typeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Movie", "Series", "Mini Series", "Anime", "Documentary", "Special"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, CONFIG.COL.CONTENT_TYPE, maxRows - 1, 1).setDataValidation(typeRule);

  // Set Column Widths
  sheet.setColumnWidth(CONFIG.COL.TITLE, 180);
  sheet.setColumnWidth(CONFIG.COL.MY_RAW_TAKE, 260);
  sheet.setColumnWidth(CONFIG.COL.PERSONAL_VERDICT, 200);
  sheet.setColumnWidth(CONFIG.COL.GENERATED_REVIEW, 300);
  sheet.setColumnWidth(CONFIG.COL.STATUS, 140);
  sheet.setColumnWidth(CONFIG.COL.PUBLISHED_URL, 220);
  sheet.setColumnWidth(CONFIG.COL.AUTOMATION_NOTES, 220);

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Headers, Dropdowns, and Validation successfully initialized!",
    "Template Ready",
    5
  );
}

// ==============================================================================
// 2. TEST BACKEND CONNECTION
// ==============================================================================
function testBackendConnection() {
  var url = CONFIG.API_BASE_URL.replace(/\/$/, "") + "/api/automation/health";
  var options = {
    method: "get",
    headers: {
      "X-Automation-Secret": CONFIG.AUTOMATION_SECRET,
      "Content-Type": "application/json",
    },
    muteHttpExceptions: true,
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    var body = response.getContentText();

    if (code === 200) {
      var json = JSON.parse(body);
      SpreadsheetApp.getUi().alert(
        "✅ Connection Successful!\n\n" +
        "Service: " + (json.service || "The Abstract Take Automation") + "\n" +
        "Status: " + json.status + "\n" +
        "Base URL: " + json.baseUrl + "\n" +
        "Server Time: " + json.timestamp
      );
    } else {
      SpreadsheetApp.getUi().alert(
        "⚠️ Authentication Failed (HTTP " + code + ")\n\n" +
        "Response: " + body + "\n\n" +
        "Check that AUTOMATION_SECRET in Code.gs matches GOOGLE_SHEETS_AUTOMATION_SECRET in backend .env."
      );
    }
  } catch (err) {
    SpreadsheetApp.getUi().alert(
      "❌ Network Error Connecting to Backend\n\n" +
      "URL: " + url + "\n" +
      "Error: " + err.toString() + "\n\n" +
      "Ensure your backend server is running and accessible."
    );
  }
}

// ==============================================================================
// 3. STEP 1: PROCESS PENDING REVIEWS (GEMINI GENERATION)
// ==============================================================================
function processPendingReviews() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    Logger.log("Another automation process is currently running.");
    return;
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    var dataRange = sheet.getRange(2, 1, lastRow - 1, 21);
    var rows = dataRange.getValues();
    var generatedCount = 0;

    for (var i = 0; i < rows.length; i++) {
      var rowNum = i + 2;
      var row = rows[i];

      var title = String(row[CONFIG.COL.TITLE - 1] || "").trim();
      var releaseYear = row[CONFIG.COL.RELEASE_YEAR - 1];
      var contentType = String(row[CONFIG.COL.CONTENT_TYPE - 1] || "Movie").trim();
      var externalId = String(row[CONFIG.COL.EXTERNAL_ID - 1] || "").trim();
      var rating = row[CONFIG.COL.RATING - 1];
      var rawTake = String(row[CONFIG.COL.MY_RAW_TAKE - 1] || "").trim();
      var likes = String(row[CONFIG.COL.THINGS_LIKED - 1] || "").trim();
      var dislikes = String(row[CONFIG.COL.THINGS_DISLIKED - 1] || "").trim();
      var personalVerdict = String(row[CONFIG.COL.PERSONAL_VERDICT - 1] || "").trim();
      var additionalNotes = String(row[CONFIG.COL.ADDITIONAL_NOTES - 1] || "").trim();
      var status = String(row[CONFIG.COL.STATUS - 1] || "").trim();

      // Only process rows where Status = "Pending"
      if (status !== CONFIG.STATUS_VALUES.PENDING) {
        continue;
      }

      // Check minimum required fields
      if (!title || !releaseYear || !rating || !rawTake || !personalVerdict) {
        sheet.getRange(rowNum, CONFIG.COL.AUTOMATION_NOTES).setValue(
          "Incomplete: Title, Release Year, Rating, Raw Take, and Personal Verdict are required."
        );
        continue;
      }

      // Prevent duplicate generation if already generated
      var existingReview = String(row[CONFIG.COL.GENERATED_REVIEW - 1] || "").trim();
      if (existingReview.length > 50) {
        sheet.getRange(rowNum, CONFIG.COL.STATUS).setValue(CONFIG.STATUS_VALUES.REVIEW_GENERATED);
        continue;
      }

      // Indicate active generation in notes
      sheet.getRange(rowNum, CONFIG.COL.AUTOMATION_NOTES).setValue("Generating review via Gemini...");
      SpreadsheetApp.flush();

      try {
        var draft = callBackendGenerateApi({
          rowId: "sheet-row-" + rowNum,
          title: title,
          releaseYear: releaseYear,
          contentType: contentType,
          externalId: externalId,
          rating: rating,
          rawTake: rawTake,
          likes: likes,
          dislikes: dislikes,
          personalVerdict: personalVerdict,
          additionalNotes: additionalNotes,
        });

        if (draft && draft.data) {
          var d = draft.data;
          // Write generated fields into columns 11 to 17
          sheet.getRange(rowNum, CONFIG.COL.GENERATED_HEADLINE).setValue(d.headline || "");
          sheet.getRange(rowNum, CONFIG.COL.GENERATED_REVIEW).setValue(d.editorialReview || "");
          sheet.getRange(rowNum, CONFIG.COL.GENERATED_PROS).setValue(d.pros || "");
          sheet.getRange(rowNum, CONFIG.COL.GENERATED_CONS).setValue(d.cons || "");
          sheet.getRange(rowNum, CONFIG.COL.GENERATED_VERDICT).setValue(d.verdict || "");
          sheet.getRange(rowNum, CONFIG.COL.GENERATED_SEO_DESC).setValue(d.seoDescription || "");
          sheet.getRange(rowNum, CONFIG.COL.GENERATED_TAGS).setValue(d.tags || "");

          // Update Status to "Review generated"
          sheet.getRange(rowNum, CONFIG.COL.STATUS).setValue(CONFIG.STATUS_VALUES.REVIEW_GENERATED);
          sheet.getRange(rowNum, CONFIG.COL.LAST_PROCESSED).setValue(new Date().toISOString());
          sheet.getRange(rowNum, CONFIG.COL.AUTOMATION_NOTES).setValue("Review generated successfully. Awaiting manual approval ('Publish it').");
          generatedCount++;
        }
      } catch (genErr) {
        Logger.log("Generation error row " + rowNum + ": " + genErr.toString());
        sheet.getRange(rowNum, CONFIG.COL.AUTOMATION_NOTES).setValue("Generation failed: " + genErr.toString());
        // Status remains "Pending" for retry
      }
    }

    if (generatedCount > 0) {
      ss.toast("Generated " + generatedCount + " review(s). Please review and set Status to 'Publish it'.", "Generation Complete", 5);
    }
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 4. STEP 2: PUBLISH APPROVED REVIEWS (STATUS = 'Publish it')
// ==============================================================================
function publishApprovedReviews() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) {
    Logger.log("Another automation process is currently running.");
    return;
  }

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getActiveSheet();
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    var dataRange = sheet.getRange(2, 1, lastRow - 1, 21);
    var rows = dataRange.getValues();
    var publishedCount = 0;

    for (var i = 0; i < rows.length; i++) {
      var rowNum = i + 2;
      var row = rows[i];
      var status = String(row[CONFIG.COL.STATUS - 1] || "").trim();

      // Only publish rows with explicit manual approval: "Publish it"
      if (status !== CONFIG.STATUS_VALUES.PUBLISH_IT) {
        continue;
      }

      var title = String(row[CONFIG.COL.TITLE - 1] || "").trim();
      var releaseYear = row[CONFIG.COL.RELEASE_YEAR - 1];
      var contentType = String(row[CONFIG.COL.CONTENT_TYPE - 1] || "Movie").trim();
      var externalId = String(row[CONFIG.COL.EXTERNAL_ID - 1] || "").trim();
      var rating = row[CONFIG.COL.RATING - 1];
      var rawTake = String(row[CONFIG.COL.MY_RAW_TAKE - 1] || "").trim();
      var likes = String(row[CONFIG.COL.THINGS_LIKED - 1] || "").trim();
      var dislikes = String(row[CONFIG.COL.THINGS_DISLIKED - 1] || "").trim();
      var personalVerdict = String(row[CONFIG.COL.PERSONAL_VERDICT - 1] || "").trim();
      var additionalNotes = String(row[CONFIG.COL.ADDITIONAL_NOTES - 1] || "").trim();

      var headline = String(row[CONFIG.COL.GENERATED_HEADLINE - 1] || "").trim();
      var editorialReview = String(row[CONFIG.COL.GENERATED_REVIEW - 1] || "").trim();
      var pros = String(row[CONFIG.COL.GENERATED_PROS - 1] || "").trim();
      var cons = String(row[CONFIG.COL.GENERATED_CONS - 1] || "").trim();
      var verdict = String(row[CONFIG.COL.GENERATED_VERDICT - 1] || "").trim();
      var seoDescription = String(row[CONFIG.COL.GENERATED_SEO_DESC - 1] || "").trim();
      var tags = String(row[CONFIG.COL.GENERATED_TAGS - 1] || "").trim();

      sheet.getRange(rowNum, CONFIG.COL.AUTOMATION_NOTES).setValue("Publishing to The Abstract Take...");
      SpreadsheetApp.flush();

      try {
        var pubResult = callBackendPublishApi({
          rowId: "sheet-row-" + rowNum,
          title: title,
          releaseYear: releaseYear,
          contentType: contentType,
          externalId: externalId,
          rating: rating,
          rawTake: rawTake,
          likes: likes,
          dislikes: dislikes,
          personalVerdict: personalVerdict,
          additionalNotes: additionalNotes,
          headline: headline,
          editorialReview: editorialReview,
          pros: pros,
          cons: cons,
          verdict: verdict,
          seoDescription: seoDescription,
          tags: tags,
        });

        if (pubResult && pubResult.success) {
          // Write Published Status and Canonical URL
          sheet.getRange(rowNum, CONFIG.COL.STATUS).setValue(CONFIG.STATUS_VALUES.PUBLISHED);
          sheet.getRange(rowNum, CONFIG.COL.PUBLISHED_URL).setValue(pubResult.publishedUrl);
          sheet.getRange(rowNum, CONFIG.COL.LAST_PROCESSED).setValue(new Date().toISOString());
          sheet.getRange(rowNum, CONFIG.COL.AUTOMATION_NOTES).setValue(
            "Live on website! Slug: " + pubResult.slug + (pubResult.isUpdate ? " (Updated)" : " (New)")
          );
          publishedCount++;
        } else {
          sheet.getRange(rowNum, CONFIG.COL.AUTOMATION_NOTES).setValue(
            "Publish failed: " + (pubResult.message || "Unknown error")
          );
        }
      } catch (pubErr) {
        Logger.log("Publish error row " + rowNum + ": " + pubErr.toString());
        sheet.getRange(rowNum, CONFIG.COL.AUTOMATION_NOTES).setValue("Publish failed: " + pubErr.toString());
        // Status remains "Publish it" so it can be retried
      }
    }

    if (publishedCount > 0) {
      ss.toast("Successfully published " + publishedCount + " review(s) to The Abstract Take!", "Publication Live", 5);
    }
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 5. RUN FULL AUTOMATION CYCLE
// ==============================================================================
function runFullCycle() {
  processPendingReviews();
  publishApprovedReviews();
}

// ==============================================================================
// 6. BACKEND API CALLS (HTTP UrlFetchApp)
// ==============================================================================
function callBackendGenerateApi(payload) {
  var url = CONFIG.API_BASE_URL.replace(/\/$/, "") + "/api/automation/generate";
  var options = {
    method: "post",
    headers: {
      "X-Automation-Secret": CONFIG.AUTOMATION_SECRET,
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

function callBackendPublishApi(payload) {
  var url = CONFIG.API_BASE_URL.replace(/\/$/, "") + "/api/automation/publish";
  var options = {
    method: "post",
    headers: {
      "X-Automation-Secret": CONFIG.AUTOMATION_SECRET,
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
// 7. TIME TRIGGERS (5-MINUTE INTERVAL AUTOMATION)
// ==============================================================================
function installAutomationTriggers() {
  removeAutomationTriggers();

  // Create Time-Driven Trigger every 5 minutes
  ScriptApp.newTrigger("runFullCycle")
    .timeBased()
    .everyMinutes(5)
    .create();

  SpreadsheetApp.getUi().alert(
    "⏰ Automatic 5-Minute Trigger Installed!\n\n" +
    "Google Sheets will automatically check for completed 'Pending' rows, " +
    "generate reviews via Gemini, and publish any approved 'Publish it' reviews every 5 minutes."
  );
}

function removeAutomationTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  SpreadsheetApp.getActiveSpreadsheet().toast("All automation triggers removed.", "Triggers Cleared", 4);
}
