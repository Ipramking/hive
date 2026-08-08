/// <reference types="node" />
import { getSession } from '../_lib/session'

export default async function handler(req: any, res: any) {
  const session = await getSession(req)
  if (!session) return res.status(200).json({ user: null })
  res.status(200).json({ user: { id: session.userId, email: session.email } })
}
