import { isSupabaseConfigured, testSupabaseConnection, assertProductionDatabaseConfigured } from "../server/db/supabase";
import { cloudinaryService } from "../server/services/cloudinaryService";
import { db } from "../server/db";

async function main() {
  console.log("==================================================");
  console.log("🔍 PHASE 1.1 — PRODUCTION PERSISTENCE VERIFICATION");
  console.log("==================================================");

  // 1. Supabase Persistence & Runtime Check
  console.log("\n[1] SUPABASE RUNTIME CONFIGURATION CHECK");
  const isConfigured = isSupabaseConfigured();
  console.log(`- Supabase Configured in .env: ${isConfigured ? "YES" : "NO"}`);
  const conn = await testSupabaseConnection();
  console.log(`- Connection Status: ${conn.connected ? "CONNECTED" : "OFFLINE / LOCAL BACKUP MODE"}`);
  console.log(`- Diagnostic Message: ${conn.message}`);

  // 2. Production Hardening Guard Check
  console.log("\n[2] PRODUCTION GUARDS & FAIL-FAST HARDENING");
  const prevEnv = process.env.NODE_ENV;
  (process.env as any).NODE_ENV = "production";

  let dbGuardPassed = false;
  try {
    assertProductionDatabaseConfigured();
    console.log("- Database Guard in Production: FAILED (did not throw)");
  } catch (err: any) {
    dbGuardPassed = true;
    console.log(`- Database Guard in Production: PASS (Threw expected error: "${err.message.slice(0, 75)}...")`);
  }

  let uploadGuardPassed = false;
  try {
    await cloudinaryService.uploadBase64(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "test-upload"
    );
    console.log("- Cloudinary Upload Guard in Production: FAILED (did not throw)");
  } catch (err: any) {
    uploadGuardPassed = true;
    console.log(`- Cloudinary Upload Guard in Production: PASS (Threw expected error: "${err.message.slice(0, 75)}...")`);
  }

  (process.env as any).NODE_ENV = prevEnv;

  // 3. External Media Preservation Check
  console.log("\n[3] EXTERNAL MEDIA URL PRESERVATION CHECK");
  const reviews = db.getReviews(true);
  const externalPosters = reviews.filter((r) => r.posterUrl && r.posterUrl.startsWith("http") && !r.posterUrl.includes("cloudinary"));
  console.log(`- Total Reviews: ${reviews.length}`);
  console.log(`- Externally Hosted Posters (TMDB / Unsplash preserved): ${externalPosters.length}`);
  console.log(`- Sample Preserved URL: ${externalPosters[0]?.posterUrl}`);

  console.log("\n==================================================");
  console.log(`VERIFICATION SUMMARY: Database Guard: ${dbGuardPassed ? "PASS" : "FAIL"} | Storage Guard: ${uploadGuardPassed ? "PASS" : "FAIL"}`);
  console.log("==================================================");
}

main().catch(console.error);
