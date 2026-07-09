#!/usr/bin/env node

/**
 * Starts the bundled Next.js server for the Tauri desktop build.
 * Requires Node.js on the target machine and production dependencies installed
 * next to the packaged `.next` folder.
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const appRoot = process.env.TAURI_APP_ROOT || path.resolve(__dirname, '..')
const port = process.env.PORT || '3721'
const nextBin = path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next')

if (!existsSync(nextBin)) {
  console.error(
    `[tauri-start-next] Missing Next.js binary at ${nextBin}. Run npm install in ${appRoot} before packaging.`
  )
  process.exit(1)
}

const child = spawn(process.execPath, [nextBin, 'start', '-p', port, '--hostname', '127.0.0.1'], {
  cwd: appRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    HOSTNAME: '127.0.0.1',
    PORT: port,
  },
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
