import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import type { AuthSession } from '@/types';

const SESSION_COOKIE_NAME = 'noxmarket_session';
const SESSION_DATA_COOKIE_NAME = 'noxmarket_session_data';
const AUTH_FLAG_COOKIE_NAME = 'noxmarket_authed';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(): string {
  return nanoid(32);
}

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

export function storeSession(token: string, session: AuthSession): void {}
export function getSession(token: string): AuthSession | undefined { return undefined; }
export function deleteSession(token: string): void {}

export function getSessionFromCookies(cookies: any): AuthSession | null {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionData = cookies.get(SESSION_DATA_COOKIE_NAME)?.value;
  if (!token || !sessionData) return null;
  return decodeSession(sessionData) || null;
}

export function setSessionCookie(cookies: any, token: string, session: AuthSession): void {
  const encodedSession = encodeSession(session);
  const opts = {
    path: '/',
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7
  };
  cookies.set(SESSION_COOKIE_NAME, token, opts);
  cookies.set(SESSION_DATA_COOKIE_NAME, encodedSession, opts);
  cookies.set(AUTH_FLAG_COOKIE_NAME, '1', {
    path: '/',
    httpOnly: false,
    secure: import.meta.env.PROD,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7
  });
}

export function clearSessionCookie(cookies: any): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  cookies.delete(SESSION_DATA_COOKIE_NAME, { path: '/' });
  cookies.delete(AUTH_FLAG_COOKIE_NAME, { path: '/' });
}
