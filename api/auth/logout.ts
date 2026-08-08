/// <reference types="node" />
import { clearSessionCookie } from '../_lib/session'

export default async function handler(_req: any, res: any) {
  clearSessionCookie(res)
  res.status(200).json({ ok: true })
}
