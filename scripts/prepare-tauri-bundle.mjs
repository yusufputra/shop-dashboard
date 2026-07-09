#!/usr/bin/env node

/**
 * Prepares a self-contained Next.js standalone bundle for Tauri packaging.
 * Run automatically via `npm run build:desktop`.
 */

import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const standaloneDir = path.join(root, '.next', 'standalone')
const standaloneNextDir = path.join(standaloneDir, '.next')
const outputDir = path.join(root, 'dist', 'desktop-server')

if (!existsSync(path.join(standaloneDir, 'server.js'))) {
  console.error(
    '[prepare-tauri-bundle] Missing .next/standalone/server.js. Run `TAURI=1 next build` first.'
  )
  process.exit(1)
}

console.log('[prepare-tauri-bundle] Copying static assets into standalone output...')
cpSync(path.join(root, '.next', 'static'), path.join(standaloneNextDir, 'static'), {
  recursive: true,
})

console.log('[prepare-tauri-bundle] Copying public assets...')
cpSync(path.join(root, 'public'), path.join(standaloneDir, 'public'), {
  recursive: true,
})

const envSources = ['.env.production.local', '.env.local']
let envCopied = false

for (const envFile of envSources) {
  const source = path.join(root, envFile)
  if (!existsSync(source)) {
    continue
  }

  copyFileSync(source, path.join(standaloneDir, '.env'))
  console.log(`[prepare-tauri-bundle] Bundled ${envFile} as desktop-server/.env`)
  envCopied = true
  break
}

if (!envCopied) {
  console.warn(
    '[prepare-tauri-bundle] Warning: no .env.local found. The desktop app will fail at login/API without env vars.'
  )
}

console.log('[prepare-tauri-bundle] Writing dist/desktop-server...')
rmSync(outputDir, { recursive: true, force: true })
mkdirSync(path.dirname(outputDir), { recursive: true })
cpSync(standaloneDir, outputDir, { recursive: true })

console.log('[prepare-tauri-bundle] Done.')
