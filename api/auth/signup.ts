/// <reference types="node" />
import bcrypt from 'bcryptjs'
import { sql, ensureSchema } from '../_lib/db'
import { signSession, setSessionCookie } from '../_lib/session'

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'Accounts are not configured yet.' })
  try {
    await ensureSchema()
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const email = String(body?.email ?? '').trim().toLowerCase()
    const password = String(body?.password ?? '')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (password.length < 8) return res.status(400).json({ error: 'Use at least 8 characters for your password.' })

    const existing = (await sql`select id from users where email = ${email}`) as any[]
    if (existing.length) return res.status(409).json({ error: 'An account with this email already exists. Sign in instead.' })

    const hash = await bcrypt.hash(password, 10)
    const rows = (await sql`insert into users (email, password_hash) values (${email}, ${hash}) returning id, email`) as any[]
    const u = rows[0]
    await sql`insert into user_data (user_id) values (${u.id}) on conflict do nothing`

    const token = await signSession(u.id, u.email)
    setSessionCookie(res, token)
    res.status(200).json({ user: { id: u.id, email: u.email } })
  } catch {
    res.status(500).json({ error: 'Could not create the account. Try again.' })
  }
}
