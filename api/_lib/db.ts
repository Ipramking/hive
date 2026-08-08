/// <reference types="node" />
import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL || '')

let ready = false
/** Idempotent schema bootstrap — runs once per warm instance. */
export async function ensureSchema() {
  if (ready) return
  await sql`create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text unique not null,
    password_hash text not null,
    created_at timestamptz not null default now()
  )`
  await sql`create table if not exists user_data (
    user_id uuid primary key references users(id) on delete cascade,
    data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  )`
  ready = true
}
