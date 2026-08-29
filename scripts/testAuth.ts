import "dotenv/config";
import {
  signJwt,
  verifyJwt,
  hashPassword,
  verifyPassword,
  authenticateUserCredentials,
  verifySession,
  requireAdminAuth,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginAttempts,
  AuthSessionPayload,
} from "../server/auth";

async function runAuthVerification() {
  console.log("==================================================");
  console.log("🔐 PHASE 3 — AUTHENTICATION & ROLE VERIFICATION");
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
  // TEST GROUP 1: Cryptographic JWT & Password Hashing
  // ----------------------------------------------------
  console.log("--- 1. Cryptographic JWT & Password Hashing ---");
  const testPassword = "SampleAdminPassword!2026";
  const { hash, salt } = hashPassword(testPassword);
  assert(hash.length === 128, "PBKDF2 SHA-512 Hash Generation (128 hex chars)");
  assert(verifyPassword(testPassword, hash, salt), "Password verification with correct password");
  assert(!verifyPassword("WrongPassword", hash, salt), "Password verification rejects incorrect password");

  const nowSec = Math.floor(Date.now() / 1000);
  const samplePayload: AuthSessionPayload = {
    userId: "test-admin-uuid",
    email: "admin@theabstracttake.com",
    name: "Admin User",
    role: "admin",
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const token = signJwt(samplePayload);
  assert(typeof token === "string" && token.split(".").length === 3, "Stateless JWT signature generated (3 parts)");

  const verified = verifyJwt(token);
  assert(verified !== null && verified.userId === "test-admin-uuid" && verified.role === "admin", "Stateless JWT verified successfully");

  const expiredPayload: AuthSessionPayload = {
    ...samplePayload,
    exp: nowSec - 10,
  };
  const expiredToken = signJwt(expiredPayload);
  assert(verifyJwt(expiredToken) === null, "Expired JWT is rejected");

  const tamperedToken = token.slice(0, -4) + "XXXX";
  assert(verifyJwt(tamperedToken) === null, "Tampered JWT signature is rejected");

  // ----------------------------------------------------
  // TEST GROUP 2: Authentication Credentials & Roles
  // ----------------------------------------------------
  console.log("\n--- 2. Authentication Credentials & Roles ---");
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "sample_development_password";

  // Valid login
  const validLogin = await authenticateUserCredentials(adminEmail, adminPassword, true);
  assert(validLogin.success === true, "Valid admin login succeeds");
  assert(validLogin.user?.role === "admin", "Authenticated user receives 'admin' role");
  assert(typeof validLogin.token === "string", "Valid login returns signed JWT session token");

  // Invalid password
  const invalidPasswordLogin = await authenticateUserCredentials(adminEmail, "incorrect_pw");
  assert(invalidPasswordLogin.success === false, "Invalid password login is rejected");
  assert(invalidPasswordLogin.error === "Invalid email or password.", "Error message is generic (no email leakage)");

  // Invalid email
  const invalidEmailLogin = await authenticateUserCredentials("unknown_user@fake.com", "any_password");
  assert(invalidEmailLogin.success === false, "Unknown email login is rejected");
  assert(invalidEmailLogin.error === "Invalid email or password.", "Error message is generic for unknown users");

  // Session verification
  if (validLogin.token) {
    const verifiedSession = await verifySession(validLogin.token);
    assert(verifiedSession !== null && verifiedSession.role === "admin", "verifySession confirms valid session and admin role");
  }

  // ----------------------------------------------------
  // TEST GROUP 3: Rate Limiting
  // ----------------------------------------------------
  console.log("\n--- 3. Rate Limiting Security ---");
  const testIp = "192.168.1.99";
  clearLoginAttempts(testIp);
  assert(checkLoginRateLimit(testIp).allowed === true, "Initial login attempt allowed");

  for (let i = 0; i < 5; i++) {
    recordFailedLogin(testIp);
  }
  const rateLimitStatus = checkLoginRateLimit(testIp);
  assert(rateLimitStatus.allowed === false && (rateLimitStatus.waitSeconds || 0) > 0, "5 consecutive failed attempts trigger 15-minute rate-limiting lockout");
  clearLoginAttempts(testIp);

  // ----------------------------------------------------
  // TEST GROUP 4: Role-Based Authorization Simulation
  // ----------------------------------------------------
  console.log("\n--- 4. Role-Based Authorization Enforcement ---");
  const memberPayload: AuthSessionPayload = {
    userId: "member-uuid",
    email: "member@example.com",
    name: "Reader Member",
    role: "member",
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const memberToken = signJwt(memberPayload);
  const memberUser = await verifySession(memberToken);
  assert(memberUser !== null && memberUser.role === "member", "Member user session verified with 'member' role");

  let adminAuthAllowed = false;
  let adminAuthError = "";
  const mockReq: any = {
    headers: { authorization: `Bearer ${memberToken}` },
  };
  const mockRes: any = {
    status: (code: number) => ({
      json: (data: any) => {
        adminAuthError = data.error;
      },
    }),
  };
  const mockNext = () => {
    adminAuthAllowed = true;
  };

  await requireAdminAuth(mockReq, mockRes, mockNext);
  assert(adminAuthAllowed === false && adminAuthError === "Forbidden", "requireAdminAuth strictly blocks non-admin 'member' role (HTTP 403)");

  // ----------------------------------------------------
  // TEST GROUP 5: Source Code Secret Hygiene Audit
  // ----------------------------------------------------
  console.log("\n--- 5. Source Code Secret Hygiene Audit ---");
  const fs = await import("fs");
  const path = await import("path");

  const srcDir = path.join(process.cwd(), "src");
  let foundRawSecretInSrc = false;

  function scanDir(dir: string) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(tsx|ts|jsx|js|html)$/.test(f)) {
        const content = fs.readFileSync(fullPath, "utf8");
        if (content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("secret_password_test")) {
          console.error(`Found raw secret in: ${fullPath}`);
          foundRawSecretInSrc = true;
        }
      }
    }
  }
  scanDir(srcDir);
  assert(!foundRawSecretInSrc, "Zero raw passwords or service role keys found in client src/ tree");

  console.log("\n==================================================");
  console.log(`AUTH VERIFICATION RESULT: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("==================================================");
}

runAuthVerification().catch((err) => {
  console.error("Auth verification failed with error:", err);
  process.exit(1);
});
