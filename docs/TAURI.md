# Tauri Desktop Setup

This repo includes a Tauri 2 shell that wraps the existing Next.js app.

## Architecture

```text
┌──────────────────────────────────────┐
│ Tauri window (WebView)               │
│  http://localhost:3000  (dev)        │
│  http://127.0.0.1:3721  (prod local)   │
│  https://your-deployed-url (remote)    │
└──────────────────────────────────────┘
                 │
                 ▼
        Next.js server (API routes + UI)
                 │
                 ▼
              Supabase
```

## Prerequisites

1. [Node.js](https://nodejs.org/) 20+
2. [Rust](https://www.rust-lang.org/tools/install)
3. macOS-only for local builds: Xcode Command Line Tools

On macOS:

```bash
xcode-select --install
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## Environment

Copy and fill env vars before running desktop dev:

```bash
cp .env.local.example .env.local
```

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SESSION_SECRET`

## Development

Start the desktop app with hot reload:

```bash
npm run tauri:dev
```

What happens:

1. Tauri runs `npm run dev:desktop` (`TAURI=1 next dev`)
2. The Rust shell opens a window at `http://localhost:3000`
3. `next.config.ts` disables image optimization in desktop mode to avoid Supabase private-IP errors

## Production modes

### Option A — Remote URL (recommended first)

Point the desktop shell at your deployed app. No local Node server in the installer.

```bash
export SHOP_DASHBOARD_REMOTE_URL="https://your-shop-dashboard.example.com"
npm run tauri:build
```

The installer loads that URL directly. Updates ship through your normal web deploy.

### Option B — Bundled local server (advanced)

The scaffold can spawn a local Next.js server from packaged resources on port `3721`.

Current bundle includes:

- `.next/`
- `public/`
- `package.json`
- `next.config.ts`
- `scripts/tauri-start-next.mjs`

It does **not** yet bundle `node_modules/` or a Node runtime. Before using local mode in production you still need one of:

- ship `node_modules` as extra resources, or
- embed Node via a sidecar, or
- require Node.js installed on the shop PC

Build:

```bash
npm run build
npm run tauri:build
```

## NPM scripts

| Script | Purpose |
|--------|---------|
| `npm run dev:desktop` | Next dev with desktop image settings |
| `npm run tauri:dev` | Run Tauri + Next together |
| `npm run tauri:build` | Build desktop installer |
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
  Cargo.toml           # Rust deps
  tauri.conf.json      # Tauri build config
  src/lib.rs           # Window + Next.js lifecycle
  capabilities/        # Permissions
scripts/
  tauri-start-next.mjs # Production Next.js starter
src/components/
  barcode-scan-input.tsx
src/lib/desktop/
  is-tauri.ts          # Detect desktop runtime
```

## Troubleshooting

**Rust not found**

Install Rust via rustup, then restart the terminal.

**Window opens but login/API fails**

Check `.env.local` in the project root for dev, or env vars available to the packaged app for production.

**Images not loading in desktop dev**

Ensure you use `npm run tauri:dev` (sets `TAURI=1`) rather than plain `next dev` inside Tauri.

**Production local build starts but shows blank page**

Confirm Node.js is installed and production dependencies exist beside the bundled `.next` folder, or switch to remote URL mode.

## Next steps

1. Try `npm run tauri:dev`
2. Test USB scanner on sales stock search
3. Deploy web app, then build with `SHOP_DASHBOARD_REMOTE_URL`
4. Add tray icon, auto-updater, or receipt printing via Tauri plugins when needed
