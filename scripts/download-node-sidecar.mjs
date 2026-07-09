#!/usr/bin/env node

/**
 * Downloads an official Node.js binary and places it where Tauri expects sidecar binaries.
 */

import { chmodSync, copyFileSync, createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const NODE_VERSION = '20.18.3'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const binariesDir = path.join(__dirname, '..', 'src-tauri', 'binaries')
const cacheDir = path.join(__dirname, '..', '.cache', 'node-sidecar')

function getTargetTriple() {
  if (process.env.TAURI_TARGET?.trim()) {
    return process.env.TAURI_TARGET.trim()
  }

  if (process.platform === 'darwin') {
    return process.arch === 'arm64' ? 'aarch64-apple-darwin' : 'x86_64-apple-darwin'
  }

  if (process.platform === 'win32') {
    return 'x86_64-pc-windows-msvc'
  }

  if (process.platform === 'linux') {
    return process.arch === 'arm64' ? 'aarch64-unknown-linux-gnu' : 'x86_64-unknown-linux-gnu'
  }

  throw new Error(`Unsupported platform: ${process.platform} ${process.arch}`)
}

function getNodeArchiveName(triple) {
  if (triple === 'aarch64-apple-darwin') return `node-v${NODE_VERSION}-darwin-arm64`
  if (triple === 'x86_64-apple-darwin') return `node-v${NODE_VERSION}-darwin-x64`
  if (triple === 'x86_64-pc-windows-msvc') return `node-v${NODE_VERSION}-win-x64`
  if (triple === 'aarch64-unknown-linux-gnu') return `node-v${NODE_VERSION}-linux-arm64`
  if (triple === 'x86_64-unknown-linux-gnu') return `node-v${NODE_VERSION}-linux-x64`

  throw new Error(`Unsupported target triple: ${triple}`)
}

async function downloadFile(url, destination) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }

  await pipeline(response.body, createWriteStream(destination))
}

async function main() {
  const triple = getTargetTriple()
  const archiveName = getNodeArchiveName(triple)
  const extension = triple.includes('windows') ? 'zip' : 'tar.gz'
  const archiveFile = `${archiveName}.${extension}`
  const downloadUrl = `https://nodejs.org/dist/v${NODE_VERSION}/${archiveFile}`
  const sidecarName = triple.includes('windows') ? `node-${triple}.exe` : `node-${triple}`
  const sidecarPath = path.join(binariesDir, sidecarName)

  mkdirSync(binariesDir, { recursive: true })
  mkdirSync(cacheDir, { recursive: true })

  if (existsSync(sidecarPath)) {
    console.log(`[download-node-sidecar] Reusing ${sidecarPath}`)
    return
  }

  const cachedArchive = path.join(cacheDir, archiveFile)
  if (!existsSync(cachedArchive)) {
    console.log(`[download-node-sidecar] Downloading ${downloadUrl}`)
    await downloadFile(downloadUrl, cachedArchive)
  }

  const extractDir = path.join(cacheDir, archiveName)
  if (!existsSync(extractDir)) {
    console.log(`[download-node-sidecar] Extracting ${archiveFile}`)
    if (extension === 'zip') {
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Path '${cachedArchive}' -DestinationPath '${cacheDir}' -Force"`,
        { stdio: 'inherit' }
      )
    } else {
      execSync(`tar -xzf "${cachedArchive}" -C "${cacheDir}"`, { stdio: 'inherit' })
    }
  }

  const nodeSource = triple.includes('windows')
    ? path.join(extractDir, 'node.exe')
    : path.join(extractDir, 'bin', 'node')

  if (!existsSync(nodeSource)) {
    throw new Error(`Node binary not found after extraction: ${nodeSource}`)
  }

  copyFileSync(nodeSource, sidecarPath)
  if (!triple.includes('windows')) {
    chmodSync(sidecarPath, 0o755)
  }

  console.log(`[download-node-sidecar] Installed ${sidecarPath}`)
}

main().catch((error) => {
  console.error('[download-node-sidecar]', error.message)
  process.exit(1)
})
