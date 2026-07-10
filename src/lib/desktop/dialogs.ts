'use client'

import { isTauriDesktop } from '@/lib/desktop/is-tauri'

type DialogKind = 'info' | 'warning' | 'error'

export async function confirmDialog(message: string, title = 'Konfirmasi'): Promise<boolean> {
  if (isTauriDesktop()) {
    const { ask } = await import('@tauri-apps/plugin-dialog')
    return ask(message, {
      title,
      kind: 'warning',
      okLabel: 'Ya',
      cancelLabel: 'Batal',
    })
  }

  return window.confirm(message)
}

export async function alertDialog(
  message: string,
  title = 'Pemberitahuan',
  kind: DialogKind = 'info',
): Promise<void> {
  if (isTauriDesktop()) {
    const { message: showMessage } = await import('@tauri-apps/plugin-dialog')
    await showMessage(message, {
      title,
      kind,
    })
    return
  }

  window.alert(message)
}
