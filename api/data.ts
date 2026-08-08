/// <reference types="node" />
// Per-user saved data (modes, history, settings) — one JSON blob per account.
import { sql, ensureSchema } from './_lib/db.js'
import { getSession } from './_lib/session.js'

export default async function handler(req: any, res: any) {
  if (!process.env.DATABASE_URL) return res.status(503).json({ error: 'not configured' })
  const session = await getSession(req)
  if (!session) return res.status(401).json({ error: 'Sign in to sync your data.' })
  try {
    await ensureSchema()
    if (req.method === 'GET') {
      const rows = (await sql`select data from user_data where user_id = ${session.userId}`) as any[]
      return res.status(200).json({ data: rows[0]?.data ?? {} })
    }
    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
      const data = body?.data ?? {}
      await sql`insert into user_data (user_id, data, updated_at) values (${session.userId}, ${JSON.stringify(data)}::jsonb, now())
                on conflict (user_id) do update set data = excluded.data, updated_at = now()`
      return res.status(200).json({ ok: true })
    }
    res.status(405).json({ error: 'method not allowed' })
  } catch {
    res.status(500).json({ error: 'Could not save your data.' })
  }
}
