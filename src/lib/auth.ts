import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import type { AuthSession } from '@/types';

const SESSION_COOKIE_NAME = 'noxmarket_session';

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

// Session storage (in production, use a database or Redis)
const sessions = new Map<string, AuthSession>();

// Store session
export function storeSession(token: string, session: AuthSession): void {
  sessions.set(token, session);
}

// Get session
export function getSession(token: string): AuthSession | undefined {
  return sessions.get(token);
}

// Delete session
export function deleteSession(token: string): void {
  sessions.delete(token);
}

// Get session from cookies
export function getSessionFromCookies(cookies: any): AuthSession | null {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!token) {
    return null;
  }
  
  const session = getSession(token);
  return session || null;
}

// Set session cookie
export function setSessionCookie(cookies: any, token: string): void {
  cookies.set(SESSION_COOKIE_NAME, token, {
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
}