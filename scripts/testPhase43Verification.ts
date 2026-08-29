import "dotenv/config";
import fs from "fs";
import path from "path";

async function runPhase43Verification() {
  console.log("==================================================");
  console.log("🏛️  PHASE 4.3 — SEO, METADATA & SCHEMA VERIFICATION");
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

  // ----------------------------------------------------
  // TEST GROUP 1: Abstract Score Data Model (Strict 1–10 Scale)
  // ----------------------------------------------------
  console.log("--- 1. Abstract Score Scale Audit (Strict 1–10) ---");
  const reviewsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "next-app", "data", "reviews.json"), "utf-8"));
  let allScoresValid = true;
  let invalidScoresFound: number[] = [];

  for (const r of reviewsData) {
    if (typeof r.abstractScore !== "number" || r.abstractScore < 1 || r.abstractScore > 10) {
      allScoresValid = false;
      invalidScoresFound.push(r.abstractScore);
    }
  }
  assert(allScoresValid, "All reviews in database natively use strict 1–10 Abstract Scores", `Found invalid scores: ${invalidScoresFound.join(", ")}`);

  const recData = JSON.parse(fs.readFileSync(path.join(process.cwd(), "next-app", "data", "recommendations.json"), "utf-8"));
  let allRecScoresValid = true;
  for (const list of recData) {
    for (const item of list.items || []) {
      if (typeof item.abstractScore === "number" && (item.abstractScore < 1 || item.abstractScore > 10)) {
        allRecScoresValid = false;
      }
    }
  }
  assert(allRecScoresValid, "All recommendation list items use strict 1–10 Abstract Scores");

  // ----------------------------------------------------
  // TEST GROUP 2: Canonical URL & SEO Generators
  // ----------------------------------------------------
  console.log("\n--- 2. Canonical URL & Metadata Generators ---");
  const { getCanonicalUrl, getOgImageUrl } = await import("../next-app/lib/seo/url");
  const { buildReviewMetadata, buildRecommendationMetadata, buildTagMetadata, buildCategoryMetadata } = await import("../next-app/lib/seo/metadata");

  assert(getCanonicalUrl("/").startsWith("http") && !getCanonicalUrl("/").endsWith("//"), "getCanonicalUrl('/') returns clean base URL");
  assert(getCanonicalUrl("/reviews/dune-part-two-2024").endsWith("/reviews/dune-part-two-2024"), "getCanonicalUrl('/reviews/dune-part-two-2024') matches expected path");

  const sampleReview = reviewsData[0];
  const reviewMeta = buildReviewMetadata(sampleReview);
  assert(typeof reviewMeta.title === "string" && reviewMeta.title.includes("Review — Abstract Score"), "buildReviewMetadata generates standard branded review title");
  assert(typeof reviewMeta.description === "string" && reviewMeta.description.length > 10, "buildReviewMetadata generates safe editorial description");
  assert((reviewMeta.openGraph as any)?.type === "article", "Review OpenGraph type is 'article'");

  const sampleList = recData[0];
  const recMeta = buildRecommendationMetadata(sampleList);
  assert(typeof recMeta.title === "string" && recMeta.title.includes("The Abstract Take Recommends"), "buildRecommendationMetadata generates curated watchlist title");

  // ----------------------------------------------------
  // TEST GROUP 3: Tag & Category Indexing Strategies
  // ----------------------------------------------------
  console.log("\n--- 3. Tag & Category Indexing Rules ---");
  const thinTagMeta = buildTagMetadata("rare-tag", "rare-tag", 1);
  assert(thinTagMeta.robots && (thinTagMeta.robots as any).index === false, "Tag with 1 review is set to noindex, follow");

  const popularTagMeta = buildTagMetadata("sci-fi", "sci-fi", 5);
  assert(popularTagMeta.robots && (popularTagMeta.robots as any).index === true, "Tag with 5 reviews is set to index, follow");

  const thinCategoryMeta = buildCategoryMetadata("empty-cat", "empty-cat", 0);
  assert(thinCategoryMeta.robots && (thinCategoryMeta.robots as any).index === false, "Empty category is set to noindex, follow");

  const activeCategoryMeta = buildCategoryMetadata("Movies", "movies", 4);
  assert(activeCategoryMeta.robots && (activeCategoryMeta.robots as any).index === true, "Active category is set to index, follow");

  // ----------------------------------------------------
  // TEST GROUP 4: Structured Data (Schema.org JSON-LD)
  // ----------------------------------------------------
  console.log("\n--- 4. Structured Data (JSON-LD) Integrity ---");
  const { generateReviewStructuredData, generateRecommendationStructuredData, generateBreadcrumbStructuredData, generateWebSiteStructuredData } = await import("../next-app/lib/seo/structuredData");

  const reviewSchema: any = generateReviewStructuredData(sampleReview);
  assert(reviewSchema["@type"] === "Review", "Schema @type is 'Review'");
  assert(reviewSchema.itemReviewed && (reviewSchema.itemReviewed["@type"] === "Movie" || reviewSchema.itemReviewed["@type"] === "TVSeries"), "itemReviewed is Movie or TVSeries");
  assert(reviewSchema.reviewRating?.ratingValue === String(sampleReview.abstractScore), `reviewRating value matches Abstract Score: ${sampleReview.abstractScore}`);
  assert(reviewSchema.reviewRating?.bestRating === "10", "reviewRating bestRating is '10'");
  assert(reviewSchema.aggregateRating === undefined, "No fabricated aggregateRating exists");

  const recSchema: any = generateRecommendationStructuredData(sampleList);
  assert(recSchema["@type"] === "ItemList", "Recommendation schema @type is 'ItemList'");
  assert(Array.isArray(recSchema.itemListElement) && recSchema.itemListElement.length > 0, "ItemList includes curated works array");

  const breadcrumbsSchema: any = generateBreadcrumbStructuredData([
    { name: "Home", path: "/" },
    { name: "Reviews", path: "/reviews" },
    { name: "Dune", path: "/reviews/dune-part-two-2024" },
  ]);
  assert(breadcrumbsSchema["@type"] === "BreadcrumbList", "Breadcrumb schema @type is 'BreadcrumbList'");
  assert(breadcrumbsSchema.itemListElement.length === 3, "Breadcrumbs has 3 levels");

  const websiteSchema: any = generateWebSiteStructuredData();
  assert(websiteSchema["@type"] === "WebSite", "WebSite schema @type is 'WebSite'");
  assert(websiteSchema.potentialAction?.["@type"] === "SearchAction", "WebSite schema includes SearchAction target");

  // ----------------------------------------------------
  // TEST GROUP 5: Dynamic Robots & Sitemap
  // ----------------------------------------------------
  console.log("\n--- 5. Robots.txt and Dynamic Sitemap ---");
  const robotsModule = await import("../next-app/app/robots");
  const robotsResult = robotsModule.default();
  assert(Array.isArray((robotsResult.rules as any).disallow) && (robotsResult.rules as any).disallow.includes("/admin/"), "Robots.txt disallows /admin/");
  assert((robotsResult.rules as any).disallow.includes("/search"), "Robots.txt disallows /search");
  assert(typeof robotsResult.sitemap === "string" && robotsResult.sitemap.endsWith("/sitemap.xml"), "Robots.txt points to /sitemap.xml");

  const sitemapModule = await import("../next-app/app/sitemap");
  const sitemapResult = await sitemapModule.default();
  assert(sitemapResult.length > 0, `Sitemap generated ${sitemapResult.length} indexable URLs`);

  const hasAdmin = sitemapResult.some((entry) => entry.url.includes("/admin"));
  const hasSearch = sitemapResult.some((entry) => entry.url.includes("/search"));
  assert(!hasAdmin, "Sitemap excludes /admin routes");
  assert(!hasSearch, "Sitemap excludes /search routes");

  const hasPublishedReview = sitemapResult.some((entry) => entry.url.includes("/reviews/dune-part-two-2024"));
  assert(hasPublishedReview, "Sitemap includes published reviews");

  // ----------------------------------------------------
  // TEST GROUP 6: Dynamic OG Image Generator Endpoint
  // ----------------------------------------------------
  console.log("\n--- 6. Dynamic OpenGraph Social Image Generator ---");
  assert(fs.existsSync(path.join(process.cwd(), "next-app", "app", "api", "og", "route.tsx")), "app/api/og/route.tsx exists");
  const ogRouteContent = fs.readFileSync(path.join(process.cwd(), "next-app", "app", "api", "og", "route.tsx"), "utf-8");
  assert(ogRouteContent.includes("ImageResponse"), "app/api/og/route.tsx uses Next.js ImageResponse");
  assert(ogRouteContent.includes("#008CFF"), "app/api/og/route.tsx renders signature Electric Blue branding");

  console.log("\n==================================================");
  console.log(`PHASE 4.3 VERIFICATION: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================");
}

runPhase43Verification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
