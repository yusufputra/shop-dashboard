# Tauri Desktop Setup

This repo includes a Tauri 2 shell that wraps the existing Next.js app.

## Architecture

```text
┌─────────────────────────────────────────────┐
│ Tauri window (WebView)                      │
│  http://localhost:3000        (dev)         │
│  http://127.0.0.1:3721      (prod local)    │
│  https://your-deployed-url  (remote opt-in) │
└─────────────────────────────────────────────┘
                 │
                 ▼
   Bundled Node sidecar + Next.js standalone server
                 │
                 ▼
              Supabase (still needs internet)
```

## Prerequisites

1. [Node.js](https://nodejs.org/) 20+ on the build machine
2. [Rust](https://www.rust-lang.org/tools/install)
3. macOS builds: Xcode Command Line Tools

On macOS:

```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Environment

Copy and fill env vars before building or running desktop dev:

```bash
cp .env.local.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SESSION_SECRET`

For **local desktop builds**, `.env.local` is copied into the installer at build time as `desktop-server/.env`.

Important: server-side secrets are embedded in the desktop app bundle. Treat the installer like a sensitive internal artifact.

## Development

Start the desktop app with hot reload:

```bash
npm run tauri:dev
```

What happens:

1. Tauri runs `npm run dev:desktop` (`TAURI=1 next dev`)
2. The Rust shell opens a window at `http://localhost:3000`
3. `next.config.ts` disables image optimization in desktop mode to avoid Supabase private-IP errors

## Production: fully local desktop build (default)

This is the main path. No remote URL required.

```bash
npm run tauri:build:local
```

What this does:

1. Downloads an official Node.js binary for your OS/arch into `src-tauri/binaries/`
2. Builds Next.js with `output: "standalone"` (minimal traced `node_modules`)
3. Prepares `dist/desktop-server/` with static assets, `public/`, and `.env`
4. Packages everything into a `.app` / `.exe` / `.dmg` installer

On launch, the desktop app:

1. Starts the bundled Node sidecar
2. Runs the bundled `server.js` on `127.0.0.1:3721`
3. Opens the Tauri window against that local URL

The shop PC does **not** need Node.js installed separately.

### What is bundled

| Piece | Included |
|-------|----------|
| Node.js runtime | Yes (sidecar) |
| Next.js server + traced deps | Yes (`dist/desktop-server`) |
| `.env.local` secrets | Yes (copied at build time) |
| Supabase connectivity | No — still requires internet |

### Installer output

After a successful build, look in:

```text
src-tauri/target/release/bundle/
```

## Production: remote URL (optional)

Only if you prefer a thin client that loads a hosted deployment:

```bash
export SHOP_DASHBOARD_REMOTE_URL="https://your-shop-dashboard.example.com"
npm run tauri:build:remote
```

Updates then ship through your normal web deploy.

## NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run dev:desktop` | Next dev with desktop image settings |
| `npm run tauri:dev` | Run Tauri + Next together |
| `npm run build:desktop` | Build standalone server bundle only |
| `npm run tauri:build:local` | Full local desktop installer |
| `npm run tauri:build:remote` | Thin client pointing at hosted URL |
| `npm run tauri icon public/app-icon-square.png` | Regenerate app icons |

## USB barcode scanners

Most USB scanners work in **keyboard wedge** mode with no native code.

The sales flow includes `BarcodeScanInput` on **Jual Perhiasan → Cari Item Stok**:

- scan a stock serial (`seri`)
- press Enter (scanner sends this automatically)
- exact match auto-selects the item

Component: `src/components/barcode-scan-input.tsx`

For serial/HID scanners later, add:

- `tauri-plugin-serialplugin` for COM ports
- `tauri-plugin-hid` for raw USB HID

## Project layout

```text
src-tauri/
  Cargo.toml
  tauri.conf.json
  src/lib.rs                 # Window + bundled server lifecycle
  binaries/node-{target}     # Downloaded Node sidecar (gitignored)
  capabilities/
scripts/
  download-node-sidecar.mjs  # Fetches Node binary before packaging
  prepare-tauri-bundle.mjs   # Builds dist/desktop-server
dist/
  desktop-server/            # Self-contained Next.js server (gitignored)
```

## Troubleshooting

**Rust not found**

Install Rust via rustup, then restart the terminal.

**Build fails on `download-node-sidecar`**

Ensure the build machine has internet access to `nodejs.org`.

**Window opens but login/API fails**

Check that `.env.local` existed when you ran `npm run tauri:build:local`.

**Images not loading in desktop dev**

Use `npm run tauri:dev` (sets `TAURI=1`) rather than plain `next dev` inside Tauri.

**Blank window after local build**

The bundled server may still be starting. Wait a few seconds. If it persists, run the packaged app from Terminal to inspect sidecar logs.

**macOS “app is damaged” or Gatekeeper issues**

Sign and notarize the app before distributing outside your shop network.

## Next steps

1. Fill `.env.local`
2. Run `npm run tauri:dev` for development
3. Run `npm run tauri:build:local` for a self-contained installer
4. Add tray icon, auto-updater, or receipt printing via Tauri plugins when needed

## GitHub Actions CI

Workflow: `.github/workflows/build-desktop.yml`

Triggers:

- manual: **Actions → Build Desktop App → Run workflow**
- automatic: push a version tag like `v0.1.0`

Build matrix:

- macOS Apple Silicon (`aarch64-apple-darwin`)
- macOS Intel (`x86_64-apple-darwin`)
- Windows x64 (`x86_64-pc-windows-msvc`)

### Required repository secrets

Add these under **Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase key |
| `AUTH_SESSION_SECRET` | JWT session signing secret (32+ chars) |

The workflow writes them into `.env.local` before building, so the desktop bundle includes runtime config.

### Artifacts

Each platform job uploads installers as GitHub Actions artifacts:

- macOS: `.dmg` and `.app`
- Windows: `.msi` and `.exe`

When you push a `v*` tag, the workflow also attaches all installers to a GitHub Release.

Note: CI builds are unsigned by default. For public distribution, add Apple/Windows code signing later.

### DevTools (Inspect Element)

Production desktop builds ship with DevTools enabled so you can right-click → **Inspect Element** (or use **F12** / **Cmd+Option+I** on macOS) inside the packaged app. This is intended for internal shop debugging only.
