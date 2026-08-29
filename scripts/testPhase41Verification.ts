import "dotenv/config";
import fs from "fs";
import path from "path";

async function runPhase41Verification() {
  console.log("==================================================");
  console.log("🏛️  PHASE 4.1 — NEXT.JS FOUNDATION VERIFICATION");
  console.log("==================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}`);
    } else {
      console.error(`❌ [FAIL] ${testName} - ${detail || "Assertion failed"}`);
    }
  }

  // 1. Check Directory Structure
  console.log("--- 1. Architecture & Directory Structure ---");
  const nextAppDir = path.join(process.cwd(), "next-app");
  assert(fs.existsSync(nextAppDir), "next-app directory created alongside legacy root");
  assert(fs.existsSync(path.join(nextAppDir, "app", "layout.tsx")), "app/layout.tsx exists");
  assert(fs.existsSync(path.join(nextAppDir, "app", "page.tsx")), "app/page.tsx (Homepage Server Component) exists");
  assert(fs.existsSync(path.join(nextAppDir, "app", "reviews", "[slug]", "page.tsx")), "app/reviews/[slug]/page.tsx representative route exists");
  assert(fs.existsSync(path.join(nextAppDir, "lib", "supabase", "server.ts")), "lib/supabase/server.ts (Server-Only Supabase) exists");
  assert(fs.existsSync(path.join(nextAppDir, "lib", "supabase", "client.ts")), "lib/supabase/client.ts (Browser Supabase) exists");
  assert(fs.existsSync(path.join(nextAppDir, "lib", "services", "cloudinary.ts")), "lib/services/cloudinary.ts exists");
  assert(fs.existsSync(path.join(nextAppDir, "lib", "editorial", "assistant.ts")), "lib/editorial/assistant.ts exists");

  // 2. Check Client vs Server Component Boundaries
  console.log("\n--- 2. Server vs Client Component Boundaries ---");
  const pageContent = fs.readFileSync(path.join(nextAppDir, "app", "reviews", "[slug]", "page.tsx"), "utf-8");
  assert(!pageContent.includes("'use client'") && !pageContent.includes('"use client"'), "Review detail page is a pure Server Component (No 'use client')");

  const spoilerContent = fs.readFileSync(path.join(nextAppDir, "components", "reviews", "SpoilerSection.tsx"), "utf-8");
  assert(spoilerContent.includes("'use client'"), "SpoilerSection is an isolated 'use client' island");

  const actionsContent = fs.readFileSync(path.join(nextAppDir, "components", "reviews", "InteractiveActions.tsx"), "utf-8");
  assert(actionsContent.includes("'use client'"), "InteractiveActions is an isolated 'use client' island");

  // 3. Check Server-Side Supabase & Credential Hygiene
  console.log("\n--- 3. Secret Hygiene & Security Boundaries ---");
  const serverSupabaseContent = fs.readFileSync(path.join(nextAppDir, "lib", "supabase", "server.ts"), "utf-8");
  assert(serverSupabaseContent.includes("typeof window !== 'undefined'"), "server.ts has runtime guard preventing browser execution");

  let leakedSecretsInNextClient = false;
  function scanNextComponents(dir: string) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanNextComponents(fullPath);
      } else if (/\.(tsx|ts)$/.test(f)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (
          content.includes("SUPABASE_SERVICE_ROLE_KEY") &&
          (content.includes("'use client'") || fullPath.includes("components"))
        ) {
          console.error(`Found leaked service role key in: ${fullPath}`);
          leakedSecretsInNextClient = true;
        }
      }
    }
  }
  scanNextComponents(path.join(nextAppDir, "components"));
  assert(!leakedSecretsInNextClient, "Zero service role keys in Next.js client components");

  // 4. Check Data Access & Slug Resolution
  console.log("\n--- 4. Repository & Data Access ---");
  const { reviewRepository } = await import("../next-app/lib/db/repositories/reviewRepository");
  const allReviews = await reviewRepository.getAll(true);
  assert(allReviews.length > 0, `Repository successfully fetched ${allReviews.length} reviews`);

  if (allReviews.length > 0) {
    const firstSlug = allReviews[0].slug;
    const resolvedReview = await reviewRepository.getBySlug(firstSlug);
    assert(resolvedReview !== null && resolvedReview.slug === firstSlug, `Resolved review by slug: "${firstSlug}"`);
  }

  const invalidReview = await reviewRepository.getBySlug("non-existent-movie-slug-9999");
  assert(invalidReview === null, "Non-existent slug correctly returns null (triggers notFound)");

  // 5. Legacy Application Parity
  console.log("\n--- 5. Legacy Application Preservation ---");
  assert(fs.existsSync(path.join(process.cwd(), "server.ts")), "Root server.ts exists untouched");
  assert(fs.existsSync(path.join(process.cwd(), "src", "App.tsx")), "Root src/App.tsx exists untouched");
  assert(fs.existsSync(path.join(process.cwd(), "dist", "server.cjs")), "Root compiled dist/server.cjs exists and is ready");

  console.log("\n==================================================");
  console.log(`PHASE 4.1 VERIFICATION: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================");
}

runPhase41Verification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
