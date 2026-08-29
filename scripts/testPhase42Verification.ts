import "dotenv/config";
import fs from "fs";
import path from "path";

async function runPhase42Verification() {
  console.log("==================================================");
  console.log("🏛️  PHASE 4.2 — PUBLIC CONTENT & ROUTE VERIFICATION");
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

  const nextAppDir = path.join(process.cwd(), "next-app");

  // ----------------------------------------------------
  // TEST GROUP 1: Route Filesystem Existence
  // ----------------------------------------------------
  console.log("--- 1. Public Route Architecture ---");
  const expectedRoutes = [
    "app/page.tsx",
    "app/reviews/page.tsx",
    "app/reviews/[slug]/page.tsx",
    "app/movies/page.tsx",
    "app/series/page.tsx",
    "app/anime/page.tsx",
    "app/documentaries/page.tsx",
    "app/mini-series/page.tsx",
    "app/specials/page.tsx",
    "app/recommends/page.tsx",
    "app/recommends/[slug]/page.tsx",
    "app/what-to-watch-next/page.tsx",
    "app/category/[slug]/page.tsx",
    "app/tags/[slug]/page.tsx",
    "app/search/page.tsx",
    "app/about/page.tsx",
    "app/contact/page.tsx",
  ];

  for (const route of expectedRoutes) {
    const fullPath = path.join(nextAppDir, route);
    assert(fs.existsSync(fullPath), `Route exists: ${route}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Repository Data Access & Pagination
  // ----------------------------------------------------
  console.log("\n--- 2. Repository Data Access & Filtering ---");
  const { db } = await import("../next-app/lib/db");

  const paginated = await db.getReviewsPaginated({ limit: 4, offset: 0 });
  assert(paginated.reviews.length <= 4 && paginated.total >= paginated.reviews.length, "db.getReviewsPaginated returns limited reviews without shipping full database");

  const movies = await db.getReviewsByType("Movie", 10, 0);
  assert(Array.isArray(movies.reviews), `db.getReviewsByType('Movie') returned ${movies.reviews.length} results`);

  const series = await db.getReviewsByType("Series", 10, 0);
  assert(Array.isArray(series.reviews), `db.getReviewsByType('Series') returned ${series.reviews.length} results`);

  const anime = await db.getReviewsByType("Anime", 10, 0);
  assert(Array.isArray(anime.reviews), `db.getReviewsByType('Anime') returned ${anime.reviews.length} results`);

  const searchResults = await db.searchReviews("Severance");
  assert(searchResults.reviews.length > 0, "db.searchReviews('Severance') resolves matching review");

  const recLists = await db.getRecommendationLists();
  assert(recLists.length > 0, `db.getRecommendationLists() returned ${recLists.length} curated collections`);

  if (recLists[0]?.slug) {
    const singleRec = await db.getRecommendationBySlug(recLists[0].slug);
    assert(singleRec !== null && singleRec.items.length > 0, `db.getRecommendationBySlug('${recLists[0].slug}') resolved collection items`);
  }

  const whatNext = await db.getWhatToWatchNext();
  assert(whatNext.length > 0, `db.getWhatToWatchNext() returned ${whatNext.length} discovery picks`);

  const settings = await db.getSettings();
  assert(typeof settings.siteTitle === "string" && settings.siteTitle.length > 0, "db.getSettings() resolved site configuration");

  // ----------------------------------------------------
  // TEST GROUP 3: Abstract Score Consistency (1-10 Scale)
  // ----------------------------------------------------
  console.log("\n--- 3. Abstract Score Scale Audit (Strict 1-10) ---");
  const { normalizeScore, getQualityLabel } = await import("../next-app/lib/utils/rating");

  assert(normalizeScore(95) === 10, "Score 95 correctly normalizes to 10/10");
  assert(normalizeScore(84) === 8, "Score 84 correctly normalizes to 8/10");
  assert(normalizeScore(9) === 9, "Score 9 correctly normalizes to 9/10");
  assert(getQualityLabel(10) === "Masterpiece", "Descriptor 10/10 is 'Masterpiece'");
  assert(getQualityLabel(9) === "Brilliant", "Descriptor 9/10 is 'Brilliant'");

  // ----------------------------------------------------
  // TEST GROUP 4: Server vs Client Component Boundaries
  // ----------------------------------------------------
  console.log("\n--- 4. Server vs Client Component Boundaries ---");
  const serverFiles = [
    "components/layout/TopNavbar.tsx",
    "components/layout/Footer.tsx",
    "components/ui/AbstractScoreBadge.tsx",
    "components/ui/ReviewCard.tsx",
    "components/reviews/ReviewsArchiveView.tsx",
    "app/reviews/page.tsx",
    "app/movies/page.tsx",
    "app/search/page.tsx",
    "app/about/page.tsx",
  ];

  for (const sf of serverFiles) {
    const content = fs.readFileSync(path.join(nextAppDir, sf), "utf-8");
    assert(!content.includes("'use client'") && !content.includes('"use client"'), `Server Component (Zero JS): ${sf}`);
  }

  const clientFiles = [
    "components/layout/MobileNavMenu.tsx",
    "components/search/SearchFilterBar.tsx",
    "components/reviews/SpoilerSection.tsx",
    "components/reviews/InteractiveActions.tsx",
    "components/contact/ContactForm.tsx",
  ];

  for (const cf of clientFiles) {
    const content = fs.readFileSync(path.join(nextAppDir, cf), "utf-8");
    assert(content.includes("'use client'"), `Isolated Client Island: ${cf}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Reusable Cache Invalidation Utilities
  // ----------------------------------------------------
  console.log("\n--- 5. Cache Revalidation Utility Verification ---");
  const { revalidateReviewContent, revalidateRecommendationContent, revalidateWhatToWatchContent } = await import("../next-app/lib/cache/revalidate");
  assert(typeof revalidateReviewContent === "function", "revalidateReviewContent helper is exported");
  assert(typeof revalidateRecommendationContent === "function", "revalidateRecommendationContent helper is exported");
  assert(typeof revalidateWhatToWatchContent === "function", "revalidateWhatToWatchContent helper is exported");

  console.log("\n==================================================");
  console.log(`PHASE 4.2 VERIFICATION: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================");
}

runPhase42Verification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
