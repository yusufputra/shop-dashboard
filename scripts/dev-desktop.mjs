#!/usr/bin/env node

/**
 * Cross-platform desktop dev server: sets TAURI=1 and runs next dev.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next')

if (!existsSync(nextBin)) {
  console.error(`[dev-desktop] Missing Next.js binary at ${nextBin}. Run npm install first.`)
  process.exit(1)
}

process.env.TAURI = '1'

const child = spawn(process.execPath, [nextBin, 'dev'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 0)
})

process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
