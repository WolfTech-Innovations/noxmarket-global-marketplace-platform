import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import type { AuthSession } from '@/types';

const SESSION_COOKIE_NAME = 'noxmarket_session';
const SESSION_DATA_COOKIE_NAME = 'noxmarket_session_data';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Create session token
export function createSessionToken(): string {
  return nanoid(32);
}

// Simple encoding/decoding for session data (in production, use proper encryption)
function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64');
}

function decodeSession(encoded: string): AuthSession | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Store session in cookies
export function storeSession(token: string, session: AuthSession): void {
  // We'll store the session data in the cookie itself
  // The token is just for additional security
}

// Get session from session data cookie
export function getSession(token: string): AuthSession | undefined {
  // Not used with cookie-based storage
  return undefined;
}

// Delete session
export function deleteSession(token: string): void {
  // Not used with cookie-based storage
}

// Get session from cookies
export function getSessionFromCookies(cookies: any): AuthSession | null {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionData = cookies.get(SESSION_DATA_COOKIE_NAME)?.value;

  if (!token || !sessionData) {
    return null;
  }

  const session = decodeSession(sessionData);
  return session || null;
}

// Set session cookie with data
export function setSessionCookie(cookies: any, token: string, session: AuthSession): void {
  const encodedSession = encodeSession(session);
  
  // Set the session token cookie
  cookies.set(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  // Set the session data cookie
  cookies.set(SESSION_DATA_COOKIE_NAME, encodedSession, {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
}

// Clear session cookie
export function clearSessionCookie(cookies: any): void {
  cookies.delete(SESSION_COOKIE_NAME, {
    path: '/'
  });
  
  cookies.delete(SESSION_DATA_COOKIE_NAME, {
    path: '/'
  });
}