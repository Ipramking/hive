/// <reference types="node" />
import bcrypt from 'bcryptjs'
import { sql, ensureSchema } from '../_lib/db.js'
import { signSession, setSessionCookie } from '../_lib/session.js'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Accounts are not configured yet.' })
  try {
    await ensureSchema()
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')

    const rows = (await sql`select id, email, password_hash from users where email = ${email}`) as any[]
    const u = rows[0]
    // generic message either way — don't reveal whether the email exists
    const ok = u && (await bcrypt.compare(password, u.password_hash))
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' })

    const token = await signSession(u.id, u.email)
    setSessionCookie(res, token)
    res.status(200).json({ user: { id: u.id, email: u.email } })
  } catch {
    res.status(500).json({ error: 'Could not sign in. Try again.' })
  }
}
