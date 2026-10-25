'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'

export interface ConfirmOptions {
  title?: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * App-styled replacement for window.confirm. Returns a promise resolving true/false, so a call
 * site reads the same as the native one it replaces:
 *
 *   if (!(await confirm({ message: 'Cancel this appointment?' }))) return
 */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used within a ConfirmProvider')
  return confirm
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  // Held across renders so the dialog's buttons can settle the promise the caller is awaiting.
  const resolveRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      // A second confirm while one is open would strand the first caller forever.
      resolveRef.current?.(false)
      resolveRef.current = resolve
    })
  }, [])

  const settle = (value: boolean) => {
    setOptions(null)
    resolveRef.current?.(value)
    resolveRef.current = null
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={options !== null}
        title={options?.title ?? 'Are you sure?'}
        message={options?.message ?? ''}
        confirmText={options?.confirmLabel ?? 'OK'}
        cancelText={options?.cancelLabel ?? 'Cancel'}
        onConfirm={() => settle(true)}
        onCancel={() => settle(false)}
      />
    </ConfirmContext.Provider>
  )
}
