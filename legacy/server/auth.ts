import "dotenv/config";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { getSupabaseClient, isSupabaseConfigured } from "./db/supabase";

// ------------------------------------------------------------------------------
// 1. CONFIGURATION & SECRETS
// ------------------------------------------------------------------------------
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || "the_abstract_take_auth_jwt_key_2026_uncompromising";
const AUTOMATION_SECRET = process.env.AUTOMATION_SECRET || "abstract_sheets_editorial_sync_secret_2025";

// Default admin profile credentials configured via environment variables only
const CONFIGURED_ADMIN_EMAIL = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : "";
const CONFIGURED_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : "";
const CONFIGURED_ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const CONFIGURED_ADMIN_PASSWORD_SALT = process.env.ADMIN_PASSWORD_SALT || "";

export type UserRole = "admin" | "editor" | "member";

export interface AuthenticatedUser {
  id: string;
  authUserId?: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthSessionPayload {
  userId: string;
  authUserId?: string;
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// ------------------------------------------------------------------------------
// 2. CRYPTOGRAPHIC PASSWORD HASHING (PBKDF2 SHA-512)
// ------------------------------------------------------------------------------
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const generatedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, generatedSalt, 10000, 64, "sha512").toString("hex");
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const checkHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(checkHash, "hex"));
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------------------
// 3. STATELESS CRYPTOGRAPHIC JWT SIGNING & VERIFICATION
// ------------------------------------------------------------------------------
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signJwt(payload: AuthSessionPayload): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string): AuthSessionPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload: AuthSessionPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null; // Expired token
    }

    return payload;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------
// 4. RATE LIMITING STORE
// ------------------------------------------------------------------------------
interface RateLimitRecord {
  attempts: number;
  lockedUntil?: number;
  lastAttempt: number;
}
const loginAttempts = new Map<string, RateLimitRecord>();

export function checkLoginRateLimit(ip: string): { allowed: boolean; waitSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };

  if (record.lockedUntil && record.lockedUntil > now) {
    const waitSeconds = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  if (now - record.lastAttempt > 15 * 60 * 1000) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedLogin(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { attempts: 0, lastAttempt: now };
  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= 5) {
    record.lockedUntil = now + 15 * 60 * 1000; // 15 min lock
  }
  loginAttempts.set(ip, record);
}

export function clearLoginAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// ------------------------------------------------------------------------------
// 5. AUTHENTICATION & LOGIN LOGIC
// ------------------------------------------------------------------------------
export async function authenticateUserCredentials(
  emailOrUsername: string,
  password: string,
  keepSignedIn = false
): Promise<{
  success: boolean;
  user?: AuthenticatedUser;
  token?: string;
  error?: string;
  authSource?: "supabase" | "local_env";
}> {
  const cleanEmail = emailOrUsername.trim().toLowerCase();
  const supabase = getSupabaseClient();

  // 1. If Supabase is configured, try Supabase Auth first
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data.user) {
        // Query user profile & role from profiles table
        let role: UserRole = "member";
        let displayName = data.user.user_metadata?.display_name || cleanEmail.split("@")[0];

        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, display_name, avatar_url")
            .eq("auth_user_id", data.user.id)
            .single();

          if (profile) {
            role = profile.role as UserRole;
            displayName = profile.display_name || displayName;
          } else if (CONFIGURED_ADMIN_EMAIL && cleanEmail === CONFIGURED_ADMIN_EMAIL) {
            // Auto-provision admin profile if matching primary admin
            role = "admin";
            await supabase.from("profiles").upsert({
              auth_user_id: data.user.id,
              email: cleanEmail,
              display_name: displayName,
              role: "admin",
            });
          }
        } catch (profileErr) {
          console.warn("[AUTH] Profile lookup warning:", profileErr);
        }

        const authenticatedUser: AuthenticatedUser = {
          id: data.user.id,
          authUserId: data.user.id,
          email: cleanEmail,
          name: displayName,
          role,
        };

        const sessionDurationSeconds = keepSignedIn ? 30 * 24 * 3600 : 24 * 3600;
        const nowSec = Math.floor(Date.now() / 1000);
        const jwtPayload: AuthSessionPayload = {
          userId: authenticatedUser.id,
          authUserId: authenticatedUser.id,
          email: authenticatedUser.email,
          name: authenticatedUser.name,
          role: authenticatedUser.role,
          iat: nowSec,
          exp: nowSec + sessionDurationSeconds,
        };
        const token = signJwt(jwtPayload);

        return {
          success: true,
          user: authenticatedUser,
          token,
          authSource: "supabase",
        };
      }
    } catch (sbErr) {
      console.warn("[AUTH] Supabase Auth sign-in failed, checking environment fallback:", sbErr);
    }
  }

  // 2. Environment Admin Credentials Verification (Local Dev & Fallback)
  if (CONFIGURED_ADMIN_EMAIL && cleanEmail === CONFIGURED_ADMIN_EMAIL) {
    let passwordMatches = false;

    if (CONFIGURED_ADMIN_PASSWORD_HASH && CONFIGURED_ADMIN_PASSWORD_SALT) {
      passwordMatches = verifyPassword(password, CONFIGURED_ADMIN_PASSWORD_HASH, CONFIGURED_ADMIN_PASSWORD_SALT);
    } else if (CONFIGURED_ADMIN_PASSWORD) {
      passwordMatches = password === CONFIGURED_ADMIN_PASSWORD;
    }

    if (passwordMatches) {
      const authenticatedUser: AuthenticatedUser = {
        id: "admin-1",
        email: CONFIGURED_ADMIN_EMAIL,
        name: "The Abstract Take Editor",
        role: "admin",
      };

      const sessionDurationSeconds = keepSignedIn ? 30 * 24 * 3600 : 24 * 3600;
      const nowSec = Math.floor(Date.now() / 1000);
      const jwtPayload: AuthSessionPayload = {
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        role: "admin",
        iat: nowSec,
        exp: nowSec + sessionDurationSeconds,
      };
      const token = signJwt(jwtPayload);

      return {
        success: true,
        user: authenticatedUser,
        token,
        authSource: "local_env",
      };
    }
  }

  // Always return generic error to prevent user enumeration
  return {
    success: false,
    error: "Invalid email or password.",
  };
}

// ------------------------------------------------------------------------------
// 6. VERIFY SESSION TOKEN
// ------------------------------------------------------------------------------
export async function verifySession(token: string): Promise<AuthenticatedUser | null> {
  if (!token) return null;

  // 1. Verify our HMAC-SHA256 JWT
  const payload = verifyJwt(token);
  if (payload) {
    return {
      id: payload.userId,
      authUserId: payload.authUserId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }

  // 2. Alternatively check if token is direct Supabase Auth token
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        let role: UserRole = "member";
        let displayName = data.user.user_metadata?.display_name || data.user.email?.split("@")[0] || "User";

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, display_name")
          .eq("auth_user_id", data.user.id)
          .single();

        if (profile) {
          role = profile.role as UserRole;
          displayName = profile.display_name || displayName;
        }

        return {
          id: data.user.id,
          authUserId: data.user.id,
          email: data.user.email || "",
          name: displayName,
          role,
        };
      }
    } catch {
      return null;
    }
  }

  return null;
}

// ------------------------------------------------------------------------------
// 7. EXPRESS MIDDLEWARE: ADMIN AUTHORIZATION & AUTOMATION SEPARATION
// ------------------------------------------------------------------------------
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication token required.",
    });
  }

  const token = authHeader.split(" ")[1];
  const user = await verifySession(token);

  if (!user) {
    return res.status(401).json({
      error: "InvalidSession",
      message: "Session expired or invalid. Please log in again.",
    });
  }

  if (user.role !== "admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Access denied: Administrator privileges required.",
    });
  }

  (req as any).adminUser = user;
  next();
}

export function requireAutomationAuth(req: Request, res: Response, next: NextFunction) {
  const secretHeader = req.headers["x-automation-secret"] || req.headers["authorization"]?.replace("Bearer ", "");
  const expectedSecret = process.env.AUTOMATION_SECRET || AUTOMATION_SECRET;

  if (!secretHeader || secretHeader !== expectedSecret) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid automation authentication credentials.",
    });
  }

  next();
}

export async function requireAutomationOrAdminAuth(req: Request, res: Response, next: NextFunction) {
  const secretHeader = req.headers["x-automation-secret"];
  const expectedSecret = process.env.AUTOMATION_SECRET || AUTOMATION_SECRET;

  if (secretHeader && secretHeader === expectedSecret) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    if (token === expectedSecret) {
      return next();
    }
    const user = await verifySession(token);
    if (user && user.role === "admin") {
      (req as any).adminUser = user;
      return next();
    }
  }

  return res.status(401).json({
    error: "Unauthorized",
    message: "Valid administrator session or automation secret required.",
  });
}
