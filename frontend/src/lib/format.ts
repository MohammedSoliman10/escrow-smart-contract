import { formatEther } from 'viem'

/** 0x1234…abcd */
export function shortAddress(address?: string, lead = 6, tail = 4): string {
  if (!address) return '—'
  return `${address.slice(0, lead)}…${address.slice(-tail)}`
}

/** Formats wei as a human ETH amount with trailing zeros trimmed. */
export function formatEth(wei: bigint, maxDigits = 4): string {
  const value = Number(formatEther(wei))
  if (value !== 0 && value < 0.0001) return '<0.0001'
  return value.toLocaleString('en-US', { maximumFractionDigits: maxDigits })
}

export function isAddressLike(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim())
}

/** Extracts the most helpful message out of a viem/wagmi error. */
export function errorMessage(error: unknown): string {
  const err = error as { shortMessage?: string; message?: string } | null
  return err?.shortMessage ?? err?.message ?? 'Something went wrong'
}
