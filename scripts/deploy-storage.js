/**
 * Uploads dist/ to a public Supabase Storage bucket from your machine (local upload).
 * Loads .env from project root. Bucket must exist and be public.
 *
 * Env (in .env): NEXT_PUBLIC_SUPABASE_* or VITE_SUPABASE_* (or SUPABASE_SERVICE_ROLE_KEY for uploads).
 *
 * Usage:
 *   npm run deploy:storage        — uploads existing dist/
 *   npm run upload:storage        — build + upload (one command, run locally)
 *   node scripts/deploy-storage.js [bucket]   — custom bucket (default: web)
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const DIST_DIR = path.resolve(ROOT_DIR, 'dist')
const BUCKET = process.argv[2] || 'web'

// Load .env from project root so VITE_SUPABASE_* are available when running npm run deploy:storage
const envPath = path.join(ROOT_DIR, '.env')
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (match) {
      const value = match[2].replace(/^["']|["']$/g, '').trim()
      if (!process.env[match[1]]) process.env[match[1]] = value
    }
  }
}

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing env: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_* / SUPABASE_SERVICE_ROLE_KEY for uploads).'
  )
  process.exit(1)
}

if (!fs.existsSync(DIST_DIR)) {
  console.error('dist/ not found. Run: npm run build')
  process.exit(1)
}

function listFiles(dir, base = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const ent of entries) {
    const rel = path.join(base, ent.name)
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      files.push(...listFiles(full, rel))
    } else {
      files.push(rel.replace(/\\/g, '/'))
    }
  }
  return files
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  const files = listFiles(DIST_DIR)
  console.log(`Uploading ${files.length} files to bucket "${BUCKET}"...`)

  let ok = 0
  let err = 0
  for (const filePath of files) {
    const fullPath = path.join(DIST_DIR, filePath)
    const body = fs.readFileSync(fullPath)
    const { error } = await supabase.storage.from(BUCKET).upload(filePath, body, {
      contentType: getContentType(filePath),
      upsert: true,
    })
    if (error) {
      console.error(`  FAIL ${filePath}: ${error.message}`)
      err++
    } else {
      ok++
    }
  }

  console.log(`Done. ${ok} uploaded, ${err} failed.`)
  if (ok > 0) {
    const ref = new URL(supabaseUrl).hostname.replace('.supabase.co', '')
    console.log(
      `App URL: https://${ref}.supabase.co/storage/v1/object/public/${BUCKET}/index.html`
    )
  }
  process.exit(err > 0 ? 1 : 0)
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  const map = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
  }
  return map[ext] || 'application/octet-stream'
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
