import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getServerSupabaseClient, isServerSupabaseConfigured } from '../supabase/server';
import { UserRole, AdminUser } from '../../types';

// ------------------------------------------------------------------------------
// 1. CONFIGURATION & SECRETS
// ------------------------------------------------------------------------------
export const SESSION_COOKIE_NAME = 'abstract_session';

const JWT_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'the_abstract_take_auth_jwt_key_2026_uncompromising';

const AUTOMATION_SECRET =
  process.env.AUTOMATION_SECRET ||
  process.env.GOOGLE_SHEETS_AUTOMATION_SECRET ||
  'the_abstract_take_sheets_automation_secret_key_2026';

// Default admin profile credentials configured via environment variables
const CONFIGURED_ADMIN_EMAIL = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : '';
const CONFIGURED_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
const CONFIGURED_ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const CONFIGURED_ADMIN_PASSWORD_SALT = process.env.ADMIN_PASSWORD_SALT || '';

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
export function hashPassword(password: string, salt?: string, iterations = 100000): { hash: string; salt: string; iterations: number } {
  const generatedSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, generatedSalt, iterations, 64, 'sha512').toString('hex');
  return { hash, salt: generatedSalt, iterations };
}

export function verifyPassword(password: string, hash: string, salt: string, iterations = 100000): boolean {
  try {
    const checkHash = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
    const hashBuf = Buffer.from(hash, 'hex');
    const checkBuf = Buffer.from(checkHash, 'hex');
    if (hashBuf.length === checkBuf.length && crypto.timingSafeEqual(hashBuf, checkBuf)) {
      return true;
    }
    // Backward compatibility check for legacy 10,000 iteration hashes
    const legacyCheckHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    const legacyCheckBuf = Buffer.from(legacyCheckHash, 'hex');
    if (hashBuf.length === legacyCheckBuf.length && crypto.timingSafeEqual(hashBuf, legacyCheckBuf)) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------------------
// 3. STATELESS CRYPTOGRAPHIC JWT SIGNING & VERIFICATION
// ------------------------------------------------------------------------------
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

export function signJwt(payload: AuthSessionPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyJwt(token: string): AuthSessionPayload | null {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

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
// 5. AUTHENTICATION & LOGIN LOGIC (Single Authoritative Single-Admin Authority)
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
}> {
  const cleanEmail = emailOrUsername.trim().toLowerCase();

  // Verify against configured authoritative administrator credentials
  if (CONFIGURED_ADMIN_EMAIL && cleanEmail === CONFIGURED_ADMIN_EMAIL) {
    let passwordMatches = false;

    if (CONFIGURED_ADMIN_PASSWORD_HASH && CONFIGURED_ADMIN_PASSWORD_SALT) {
      passwordMatches = verifyPassword(password, CONFIGURED_ADMIN_PASSWORD_HASH, CONFIGURED_ADMIN_PASSWORD_SALT);
    } else if (CONFIGURED_ADMIN_PASSWORD) {
      passwordMatches = password === CONFIGURED_ADMIN_PASSWORD;
    }

    if (passwordMatches) {
      const authenticatedUser: AuthenticatedUser = {
        id: 'admin-1',
        email: CONFIGURED_ADMIN_EMAIL,
        name: 'The Abstract Take Editor',
        role: 'admin',
      };

      const sessionDurationSeconds = keepSignedIn ? 30 * 24 * 3600 : 24 * 3600;
      const nowSec = Math.floor(Date.now() / 1000);
      const jwtPayload: AuthSessionPayload = {
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        name: authenticatedUser.name,
        role: 'admin',
        iat: nowSec,
        exp: nowSec + sessionDurationSeconds,
      };
      const token = signJwt(jwtPayload);

      return {
        success: true,
        user: authenticatedUser,
        token,
      };
    }
  }

  // Generic rejection
  return {
    success: false,
    error: 'Invalid email or password.',
  };
}

// ------------------------------------------------------------------------------
// 6. VERIFY SESSION TOKEN
// ------------------------------------------------------------------------------
export async function verifySession(token: string): Promise<AuthenticatedUser | null> {
  if (!token) return null;

  // Verify stateless HMAC-SHA256 JWT
  const payload = verifyJwt(token);
  if (payload) {
    return {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  }

  return null;
}

// ------------------------------------------------------------------------------
// 7. REQUEST AUTH HELPERS (NextRequest)
// ------------------------------------------------------------------------------
export async function getAuthenticatedUserFromRequest(req: NextRequest): Promise<AuthenticatedUser | null> {
  // 1. Check HTTP-only cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    const user = await verifySession(sessionCookie);
    if (user) return user;
  }

  // 2. Check Bearer Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    const user = await verifySession(token);
    if (user) return user;
  }

  return null;
}

export async function getAuthenticatedAdmin(req: NextRequest): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUserFromRequest(req);
  if (user && user.role === 'admin') {
    return user;
  }
  return null;
}

export function validateAutomationSecret(req: NextRequest): boolean {
  const expected = process.env.AUTOMATION_SECRET || process.env.GOOGLE_SHEETS_AUTOMATION_SECRET || AUTOMATION_SECRET;
  const headerSecret = req.headers.get('x-automation-secret');
  const authHeader = req.headers.get('authorization');
  const urlSecret = req.nextUrl.searchParams.get('secret');

  let provided = headerSecret || urlSecret;
  if (!provided && authHeader && authHeader.startsWith('Bearer ')) {
    provided = authHeader.replace('Bearer ', '').trim();
  }

  return Boolean(provided && provided === expected);
}
