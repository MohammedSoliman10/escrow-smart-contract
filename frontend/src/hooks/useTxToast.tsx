import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWaitForTransactionReceipt } from 'wagmi'
import { errorMessage, shortAddress } from '../lib/format'

export interface TxToastState {
  kind: 'pending' | 'success' | 'error'
  title: string
  description?: string
  hash?: `0x${string}`
}

/**
 * Wraps `useWriteContract` with a confirm-wait and a toast state:
 * `send(() => writeContractAsync({ ... }))` handles wallet, mining and
 * refresh of the escrow list in one go.
 */
export function useTxToast() {
  const queryClient = useQueryClient()
  const [toast, setToast] = useState<TxToastState | null>(null)
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined)

  const onConfirmedRef = useRef<(() => void) | null>(null)
  const { isSuccess, isError, error, isPending } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess) {
      void queryClient.invalidateQueries({ queryKey: ['escrows'] })
      setToast({
        kind: 'success',
        title: 'Confirmed',
        description: 'The transaction is on-chain.',
        hash,
      })
      onConfirmedRef.current?.()
      onConfirmedRef.current = null
    } else if (isError) {
      setToast({
        kind: 'error',
        title: 'Transaction failed',
        description: errorMessage(error),
        hash,
      })
    }
  }, [isSuccess, isError, error, hash, queryClient])

  useEffect(() => {
    if (toast?.kind !== 'success') return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const send = useCallback(async (write: () => Promise<`0x${string}`>, onConfirmed?: () => void) => {
    onConfirmedRef.current = onConfirmed ?? null
    setHash(undefined)
    setToast({ kind: 'pending', title: 'Confirm in your wallet…' })
    try {
      const txHash = await write()
      setHash(txHash)
      setToast({ kind: 'pending', title: 'Transaction pending…', hash: txHash })
    } catch (error) {
      onConfirmedRef.current = null
      setToast({ kind: 'error', title: 'Transaction rejected', description: errorMessage(error) })
    }
  }, [])

  const dismiss = useCallback(() => setToast(null), [])

  return {
    toast,
    send,
    dismiss,
    isConfirming: Boolean(hash) && isPending,
    /** True while waiting for wallet confirmation or mining. */
    busy: toast?.kind === 'pending',
  }
}

export function TxToast({ toast, onDismiss }: { toast: TxToastState; onDismiss: () => void }) {
  const dot =
    toast.kind === 'success'
      ? 'bg-brand-green'
      : toast.kind === 'error'
        ? 'bg-brand-orange'
        : 'bg-brand-blue'

  return (
    <div className="toast-in fixed right-6 bottom-6 z-50 flex w-[21rem] max-w-[calc(100vw-3rem)] items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-2xl">
      <span
        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${dot} ${toast.kind === 'pending' ? 'animate-pulse' : ''}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs break-words text-ink-muted">{toast.description}</p>
        )}
        {toast.hash && (
          <p className="mt-1 font-mono text-[0.68rem] text-ink-muted">
            {shortAddress(toast.hash, 10, 8)}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-sm leading-none text-ink-muted transition hover:text-ink"
      >
        ✕
      </button>
    </div>
  )
}
