import { useState } from 'react'
import type { FormEvent } from 'react'
import { parseEther } from 'viem'
import { useAccount, useWriteContract } from 'wagmi'
import { TxToast, useTxToast } from '../../hooks/useTxToast'
import { FACTORY_ABI, FACTORY_ADDRESS } from '../../lib/contracts'
import { isAddressLike } from '../../lib/format'

export function CreateEscrowForm() {
  const { address, isConnected, chainId } = useAccount()
  const { writeContractAsync } = useWriteContract()
  const { toast, send, dismiss, busy } = useTxToast()

  const [seller, setSeller] = useState('')
  const [arbiter, setArbiter] = useState('')
  const [amount, setAmount] = useState('')

  const wrongChain = isConnected && chainId !== 31337
  const sellerTouched = seller.length > 0
  const arbiterTouched = arbiter.length > 0
  const amountTouched = amount.length > 0

  const sellerError = !sellerTouched
    ? undefined
    : !isAddressLike(seller)
      ? 'Enter a valid 0x address'
      : address && seller.trim().toLowerCase() === address.toLowerCase()
        ? 'You are the buyer — pick a different seller'
        : undefined

  const arbiterError = !arbiterTouched
    ? undefined
    : !isAddressLike(arbiter)
      ? 'Enter a valid 0x address'
      : undefined

  const amountNumber = Number(amount)
  const amountError = !amountTouched
    ? undefined
    : !/^\d*\.?\d+$/.test(amount.trim()) || !Number.isFinite(amountNumber) || amountNumber <= 0
      ? 'Enter an amount greater than 0'
      : undefined

  const valid =
    isAddressLike(seller) && isAddressLike(arbiter) && Boolean(amount) && !amountError
  const canSubmit = valid && isConnected && !wrongChain && Boolean(FACTORY_ADDRESS) && !busy

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const factory = FACTORY_ADDRESS
    if (!canSubmit || !factory) return

    void send(
      () =>
        writeContractAsync({
          address: factory,
          abi: FACTORY_ABI,
          functionName: 'createEscrow',
          args: [seller.trim() as `0x${string}`, arbiter.trim() as `0x${string}`],
          value: parseEther(amount.trim()),
        }),
      () => {
        // clear the form once the creation is confirmed on-chain
        setSeller('')
        setArbiter('')
        setAmount('')
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="panel p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">New escrow</h2>
        <span className="badge-dark">2-of-2</span>
      </div>
      <p className="mt-1.5 text-sm text-ink-muted">
        You are the buyer — the ETH you send is locked until both sides approve, or the arbiter
        resolves a dispute.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="seller" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Seller address
          </label>
          <input
            id="seller"
            className="field font-mono"
            placeholder="0x…"
            value={seller}
            onChange={(e) => setSeller(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {sellerError && <p className="mt-1.5 text-xs text-brand-orange">{sellerError}</p>}
        </div>

        <div>
          <label htmlFor="arbiter" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Arbiter address
          </label>
          <input
            id="arbiter"
            className="field font-mono"
            placeholder="0x…"
            value={arbiter}
            onChange={(e) => setArbiter(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {arbiterError && <p className="mt-1.5 text-xs text-brand-orange">{arbiterError}</p>}
        </div>

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-xs font-semibold text-ink-soft">
            Amount
          </label>
          <div className="relative">
            <input
              id="amount"
              className="field pr-14"
              placeholder="0.5"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoComplete="off"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-semibold text-ink-muted">
              ETH
            </span>
          </div>
          {amountError && <p className="mt-1.5 text-xs text-brand-orange">{amountError}</p>}
        </div>
      </div>

      <button type="submit" className="btn-dark mt-6 w-full" disabled={!canSubmit}>
        {busy ? 'Waiting…' : 'Create escrow'}
      </button>

      {!isConnected && (
        <p className="mt-3 text-center text-xs text-ink-muted">
          Connect a wallet to create an escrow.
        </p>
      )}
      {wrongChain && (
        <p className="mt-3 text-center text-xs text-brand-orange">
          Your wallet is on the wrong network — switch to Anvil (31337).
        </p>
      )}
      {!FACTORY_ADDRESS && (
        <p className="mt-3 text-center text-xs text-brand-orange">
          Factory not deployed yet — see the banner above.
        </p>
      )}

      {toast && <TxToast toast={toast} onDismiss={dismiss} />}
    </form>
  )
}
