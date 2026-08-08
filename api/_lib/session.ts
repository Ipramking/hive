/// <reference types="node" />
import { SignJWT, jwtVerify } from 'jose'

const COOKIE = 'hive_session'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || 'dev-only-insecure-secret-change-me')

export async function signSession(userId: string, email: string): Promise<string> {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret())
}

export async function verifySession(token: string): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    return { userId: String(payload.sub), email: String(payload.email ?? '') }
  } catch {
    return null
  }
}

function readCookie(req: any, name: string): string | null {
  const raw = req.headers?.cookie || ''
  const m = raw.match(new RegExp('(?:^|; )' + name + '=([^;]+)'))
  return m ? decodeURIComponent(m[1]) : null
}

export async function getSession(req: any): Promise<{ userId: string; email: string } | null> {
  const token = readCookie(req, COOKIE)
  if (!token) return null
  return verifySession(token)
}

export function setSessionCookie(res: any, token: string) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`)
}

export function clearSessionCookie(res: any) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`)
}
