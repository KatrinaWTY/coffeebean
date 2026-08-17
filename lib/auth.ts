import { cookies } from "next/headers"

export const ADMIN_COOKIE_NAME = "bean_buddy_admin_session"
const DEFAULT_PASSWORD = "coffee-admin-2025"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

function getAdminSecret(): string {
  return process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || DEFAULT_PASSWORD
}

// Convert string to Uint8Array for Web Crypto
function getEncoder(): TextEncoder {
  return new TextEncoder()
}

/**
 * Generate HMAC SHA-256 signature for a message
 */
async function signMessage(message: string, secret: string): Promise<string> {
  const enc = getEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  )
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Create a signed session token
 */
export async function createSessionToken(): Promise<string> {
  const timestamp = Date.now().toString()
  const secret = getAdminSecret()
  const signature = await signMessage(`admin_session:${timestamp}`, secret)
  return `${timestamp}.${signature}`
}

/**
 * Validate a session token
 */
export async function verifySessionToken(token?: string | null): Promise<boolean> {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 2) return false

  const [timestamp, signature] = parts
  const tokenTime = parseInt(timestamp, 10)
  if (isNaN(tokenTime)) return false

  // Check if expired
  const now = Date.now()
  if (now - tokenTime > SESSION_MAX_AGE * 1000) {
    return false
  }

  const secret = getAdminSecret()
  const expectedSignature = await signMessage(`admin_session:${timestamp}`, secret)
  return signature === expectedSignature
}

/**
 * Verify whether an entered password matches the admin credentials
 */
export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminSecret()
  return password === expected
}

/**
 * Set the admin HTTP-only cookie
 */
export async function setAdminSessionCookie(): Promise<void> {
  const token = await createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * Clear the admin session cookie
 */
export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}

/**
 * Check if the current request is authenticated as admin
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  return verifySessionToken(token)
}
