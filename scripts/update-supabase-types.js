/**
 * Generates TypeScript types from the Supabase project schema (cross-platform).
 * Reads SUPABASE_PROJECT_ID from env, or extracts it from VITE_SUPABASE_URL in .env.
 *
 * Usage: npm run update-types
 * Requires: Supabase CLI (npx supabase or globally installed).
 */

import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const OUT_FILE = path.join(ROOT_DIR, 'src', 'types', 'supabase.ts')

function loadEnv() {
  const envPath = path.join(ROOT_DIR, '.env')
  if (!fs.existsSync(envPath)) return
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (match) {
      const key = match[1]
      const value = match[2].replace(/^["']|["']$/g, '').trim()
      if (!process.env[key]) process.env[key] = value
    }
  }
}

function getProjectId() {
  loadEnv()
  const fromEnv = process.env.SUPABASE_PROJECT_ID
  if (fromEnv) return fromEnv
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url) {
    try {
      const host = new URL(url).hostname
      const match = host.match(/^([a-z]+)\.supabase\.co$/i)
      if (match) return match[1]
    } catch (_) {}
  }
  return null
}

const projectId = getProjectId()
if (!projectId) {
  console.error('Missing SUPABASE_PROJECT_ID. Set it in .env or pass it when running: SUPABASE_PROJECT_ID=xxx npm run update-types')
  process.exit(1)
}

const child = spawn('npx', ['supabase', 'gen', 'types', 'typescript', '--project-id', projectId], {
  cwd: ROOT_DIR,
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true,
})

let buffer = ''
child.stdout.on('data', (chunk) => { buffer += chunk })
child.on('close', (code) => {
  if (code !== 0) process.exit(code || 1)
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, buffer, 'utf8')
  console.log('Written:', OUT_FILE)
})
