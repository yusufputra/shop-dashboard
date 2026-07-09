#!/usr/bin/env node

/**
 * Cross-platform desktop build: sets TAURI=1 and runs next build + bundle prep.
 */

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')

if (!existsSync(nextBin)) {
  console.error(`[build-desktop] Missing Next.js binary at ${nextBin}. Run npm install first.`)
  process.exit(1)
}

process.env.TAURI = '1'

const build = spawnSync(process.execPath, [nextBin, 'build'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const prepare = spawnSync(process.execPath, [path.join(__dirname, 'prepare-tauri-bundle.mjs')], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

process.exit(prepare.status ?? 0)
