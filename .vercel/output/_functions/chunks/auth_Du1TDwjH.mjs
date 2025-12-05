import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const SESSION_COOKIE_NAME = "noxmarket_session";
const SESSION_DATA_COOKIE_NAME = "noxmarket_session_data";
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function createSessionToken() {
  return nanoid(32);
}
function encodeSession(session) {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}
function decodeSession(encoded) {
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
function storeSession(token, session) {
}
function deleteSession(token) {
}
function getSessionFromCookies(cookies) {
  const token = cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionData = cookies.get(SESSION_DATA_COOKIE_NAME)?.value;
  if (!token || !sessionData) {
    return null;
  }
  const session = decodeSession(sessionData);
  return session || null;
}
function setSessionCookie(cookies, token, session) {
  const encodedSession = encodeSession(session);
  cookies.set(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7
    // 7 days
  });
  cookies.set(SESSION_DATA_COOKIE_NAME, encodedSession, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7
    // 7 days
  });
}
function clearSessionCookie(cookies) {
  cookies.delete(SESSION_COOKIE_NAME, {
    path: "/"
  });
  cookies.delete(SESSION_DATA_COOKIE_NAME, {
    path: "/"
  });
}

export { setSessionCookie as a, clearSessionCookie as b, createSessionToken as c, deleteSession as d, getSessionFromCookies as g, hashPassword as h, storeSession as s, verifyPassword as v };
