import "dotenv/config";
import { signJwt, AuthSessionPayload } from "../server/auth";

async function testLiveServerAuth() {
  console.log("==================================================");
  console.log("🚀 TESTING LIVE HTTP AUTHENTICATION & API SECURITY");
  console.log("==================================================\n");

  const baseUrl = "http://127.0.0.1:3000";
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "sample_development_password";
  const automationSecret =
    process.env.AUTOMATION_SECRET ||
    process.env.GOOGLE_SHEETS_AUTOMATION_SECRET ||
    "sample_automation_secret";

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

  // 1. Valid Admin Login
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrUsername: adminEmail,
      password: adminPassword,
      keepSignedIn: true,
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.success === true, "POST /api/auth/login with valid credentials returns HTTP 200");
  assert(loginData.user?.role === "admin", "Returned user payload contains role='admin'");
  assert(typeof loginData.token === "string" && loginData.token.length > 20, "Returned signed session token");

  const adminToken = loginData.token;

  // 2. Invalid Password Login
  const badLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrUsername: adminEmail,
      password: "completely_wrong_password",
    }),
  });
  const badLoginData = await badLoginRes.json();
  assert(badLoginRes.status === 401 && badLoginData.success !== true, "POST /api/auth/login with wrong password returns HTTP 401");
  assert(badLoginData.message === "Invalid email or password.", "Error message is strictly generic");

  // 3. Verify Session Endpoint
  const sessionRes = await fetch(`${baseUrl}/api/auth/session`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const sessionData = await sessionRes.json();
  assert(sessionRes.status === 200 && sessionData.authenticated === true, "GET /api/auth/session with valid token returns authenticated=true");
  assert(sessionData.user?.role === "admin", "Session verifies user role as 'admin'");

  // 4. Verify Session Endpoint without Token
  const unauthedSessionRes = await fetch(`${baseUrl}/api/auth/session`);
  assert(unauthedSessionRes.status === 401, "GET /api/auth/session without token returns HTTP 401");

  // 5. Admin API Mutation WITHOUT Token (Must be blocked)
  const unauthedMutationRes = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Unauthorized Test Review" }),
  });
  assert(unauthedMutationRes.status === 401, "POST /api/reviews without token is blocked (HTTP 401)");

  // 6. Admin API Mutation with Non-Admin Member Token (Must be blocked with 403 Forbidden)
  const nowSec = Math.floor(Date.now() / 1000);
  const memberPayload: AuthSessionPayload = {
    userId: "member-fake-id",
    email: "member@example.com",
    name: "Reader Member",
    role: "member",
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const memberToken = signJwt(memberPayload);

  const memberMutationRes = await fetch(`${baseUrl}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${memberToken}`,
    },
    body: JSON.stringify({ title: "Member Attempting Admin Action" }),
  });
  assert(memberMutationRes.status === 403, "POST /api/reviews with 'member' role token is blocked with HTTP 403 Forbidden");

  // 7. Protected Analytics API
  const analyticsRes = await fetch(`${baseUrl}/api/analytics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(analyticsRes.status === 200, "GET /api/analytics with admin token succeeds (HTTP 200)");

  const unauthedAnalyticsRes = await fetch(`${baseUrl}/api/analytics`);
  assert(unauthedAnalyticsRes.status === 401, "GET /api/analytics without token is blocked (HTTP 401)");

  // 8. Google Sheets Automation Endpoint (Dedicated Automation Secret)
  const automationRes = await fetch(`${baseUrl}/api/automation/template-spec`, {
    headers: { "X-Automation-Secret": automationSecret },
  });
  assert(automationRes.status === 200, "GET /api/automation/template-spec with X-Automation-Secret succeeds independently");

  const unauthedAutomationRes = await fetch(`${baseUrl}/api/automation/template-spec`);
  assert(unauthedAutomationRes.status === 401, "GET /api/automation/template-spec without automation secret is blocked (HTTP 401)");

  // 9. Logout
  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(logoutRes.status === 200, "POST /api/auth/logout succeeds (HTTP 200)");

  console.log("\n==================================================");
  console.log(`LIVE SERVER AUTH RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================");
}

testLiveServerAuth().catch(console.error);
