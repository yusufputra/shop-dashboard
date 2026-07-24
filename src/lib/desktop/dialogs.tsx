'use client'

import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { AlertTriangle, Info, XCircle } from 'lucide-react'

type DialogKind = 'info' | 'warning' | 'error'

type DialogMode = 'confirm' | 'alert'

type AppDialogProps = {
  title: string
  message: string
  kind: DialogKind
  mode: DialogMode
  onConfirm: () => void
  onCancel: () => void
}

const kindStyles: Record<
  DialogKind,
  { iconBg: string; iconColor: string; Icon: typeof Info }
> = {
  info: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    Icon: Info,
  },
  warning: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    Icon: AlertTriangle,
  },
  error: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-600',
    Icon: XCircle,
  },
}

function AppDialog({
  title,
  message,
  kind,
  mode,
  onConfirm,
  onCancel,
}: AppDialogProps) {
  const primaryRef = useRef<HTMLButtonElement>(null)
  const { iconBg, iconColor, Icon } = kindStyles[kind]

  useEffect(() => {
    primaryRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
        return
      }

      if (event.key === 'Enter' && mode === 'alert') {
        event.preventDefault()
        onConfirm()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, onCancel, onConfirm])

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={mode === 'confirm' ? onCancel : onConfirm}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg}`}
            >
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                id="app-dialog-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
              <p
                id="app-dialog-message"
                className="mt-2 whitespace-pre-wrap text-sm text-gray-600"
              >
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          {mode === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                ref={primaryRef}
                type="button"
                onClick={onConfirm}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                Ya
              </button>
            </>
          ) : (
            <button
              ref={primaryRef}
              type="button"
              onClick={onConfirm}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function showAppDialog(options: {
  title: string
  message: string
  kind: DialogKind
  mode: DialogMode
}): Promise<boolean> {
  if (typeof document === 'undefined') {
    return Promise.resolve(false)
  }

  return new Promise((resolve) => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const root = createRoot(host)
    let settled = false

    const finish = (value: boolean) => {
      if (settled) return
      settled = true
      root.unmount()
      host.remove()
      resolve(value)
    }

    root.render(
      <AppDialog
        title={options.title}
        message={options.message}
        kind={options.kind}
        mode={options.mode}
        onConfirm={() => finish(true)}
        onCancel={() => finish(false)}
      />,
    )
  })
}

export async function confirmDialog(
  message: string,
  title = 'Konfirmasi',
): Promise<boolean> {
  return showAppDialog({
    title,
    message,
    kind: 'warning',
    mode: 'confirm',
  })
}

export async function alertDialog(
  message: string,
  title = 'Pemberitahuan',
  kind: DialogKind = 'info',
): Promise<void> {
  await showAppDialog({
    title,
    message,
    kind,
    mode: 'alert',
  })
}
