async function testRoutes() {
  const routes = [
    '/',
    '/reviews',
    '/reviews/dune-part-two-2024',
    '/movies',
    '/series',
    '/anime',
    '/documentaries',
    '/mini-series',
    '/specials',
    '/recommends',
    '/recommends/hidden-gems',
    '/what-to-watch-next',
    '/category/sci-fi',
    '/tags/masterpiece',
    '/search?q=dune',
    '/about',
    '/contact',
    '/admin',
    '/unknown-nonexistent-route'
  ];

  console.log('==================================================');
  console.log('🎬 TESTING PUBLIC & ADMIN ROUTE ACCESSIBILITY');
  console.log('==================================================\n');

  let passed = 0;
  for (const r of routes) {
    try {
      const res = await fetch('http://127.0.0.1:3000' + r);
      const text = await res.text();
      const isHtml = text.includes('<!doctype html>') || text.includes('id="root"');
      const statusOk = res.status === 200;
      console.log(`Route: ${r.padEnd(30)} -> HTTP ${res.status} [SPA Response: ${isHtml ? "PASS" : "FAIL"}]`);
      if (statusOk && isHtml) passed++;
    } catch (e: any) {
      console.log(`Route: ${r.padEnd(30)} -> Error: ${e.message}`);
    }
  }

  console.log(`\n==================================================`);
  console.log(`TOTAL ROUTES TESTED: ${routes.length} | PASSED: ${passed}`);
  console.log(`==================================================`);
}

testRoutes().catch(console.error);
