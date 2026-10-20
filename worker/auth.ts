// Passcodes, sessions and one-time codes (SPEC.md, Security rules).
//
// * A passcode is never stored, logged or sent back: only a PBKDF2-SHA256
//   hash with its own random salt is kept.
// * A session is a random token in an HttpOnly cookie; the database keeps
//   only the token's SHA-256 hash.

import type { Db } from "./db.ts";
import { DAY, HOUR, wib, wibAfter } from "./time.ts";

/** The most Cloudflare Workers allows. Stored with each hash, so it can change later. */
export const PBKDF2_ITERATIONS = 100_000;
const HASH_PREFIX = "pbkdf2-sha256";

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 90;
/** A session's expiry moves forward on a visit at most once an hour, to save database writes. */
const SESSION_REFRESH = HOUR;

/** Capital letters and digits without the look-alikes 0, 1, I and O: 32 characters. */
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const encoder = new TextEncoder();

// --- Bytes ------------------------------------------------------------------

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Compares every byte, so the time taken doesn't hint at where they differ. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** Random characters from CODE_ALPHABET. 32 letters divide 256 evenly, so every one is equally likely. */
export function randomCode(length: number): string {
  return [...randomBytes(length)].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}

// --- Passcodes ----------------------------------------------------------------

async function derive(passcode: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(passcode), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256);
  return new Uint8Array(bits);
}

/** Returns what the users table stores: "pbkdf2-sha256:<iterations>:<hash>" and the salt, both as text. */
export async function hashPasscode(passcode: string): Promise<{ hash: string; salt: string }> {
  const salt = randomBytes(16);
  const hash = await derive(passcode, salt, PBKDF2_ITERATIONS);
  return { hash: `${HASH_PREFIX}:${PBKDF2_ITERATIONS}:${toBase64(hash)}`, salt: toBase64(salt) };
}

export async function verifyPasscode(passcode: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const [prefix, iterations, hash] = storedHash.split(":");
  if (prefix !== HASH_PREFIX || !iterations || !hash) return false;
  const attempt = await derive(passcode, fromBase64(storedSalt), Number(iterations));
  return sameBytes(attempt, fromBase64(hash));
}

/** Does the same work as checking a real account, so "no such username" takes as long as "wrong passcode". */
export async function burnPasscodeCheck(passcode: string): Promise<void> {
  await derive(passcode, new Uint8Array(16), PBKDF2_ITERATIONS);
}

// --- Sessions -------------------------------------------------------------------

async function hashToken(token: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(token)));
}

function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_DAYS * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function readSessionToken(request: Request): string | null {
  for (const part of (request.headers.get("cookie") ?? "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE && value.length > 0) return value.join("=");
  }
  return null;
}

/** Creates a session for the account and returns the Set-Cookie header that carries it. */
export async function startSession(db: Db, userId: string, now: Date): Promise<string> {
  const token = toBase64(randomBytes(32)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  await db
    .prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at, last_seen_at, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), userId, await hashToken(token), wibAfter(now, SESSION_DAYS * DAY), wib(now), wib(now))
    .run();
  return sessionCookie(token);
}

export type SessionUser = {
  sessionId: string;
  userId: string;
  username: string;
  isAdmin: boolean;
  mustChangePasscode: boolean;
  /** A fresh Set-Cookie header when the session was just extended; send it back with the answer. */
  refreshedCookie: string | null;
};

/** The logged-in account for this request, or null when there's no valid session. */
export async function findSession(db: Db, request: Request, now: Date): Promise<SessionUser | null> {
  const token = readSessionToken(request);
  if (!token) return null;
  const row = await db
    .prepare(
      `SELECT s.id AS session_id, s.last_seen_at, u.id AS user_id, u.username, u.is_admin, u.must_change_passcode
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .bind(await hashToken(token), wib(now))
    .first<{ session_id: string; last_seen_at: string; user_id: string; username: string; is_admin: number; must_change_passcode: number }>();
  if (!row) return null;

  let refreshedCookie: string | null = null;
  if (row.last_seen_at < wibAfter(now, -SESSION_REFRESH)) {
    await db
      .prepare("UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?")
      .bind(wib(now), wibAfter(now, SESSION_DAYS * DAY), row.session_id)
      .run();
    refreshedCookie = sessionCookie(token);
  }

  return {
    sessionId: row.session_id,
    userId: row.user_id,
    username: row.username,
    isAdmin: row.is_admin === 1,
    mustChangePasscode: row.must_change_passcode === 1,
    refreshedCookie,
  };
}
