import { useWriteContract } from 'wagmi'
import type { EscrowRow } from '../../hooks/useEscrows'
import { TxToast, useTxToast } from '../../hooks/useTxToast'
import { ESCROW_ABI } from '../../lib/contracts'
import { formatEth, shortAddress } from '../../lib/format'

const STATUS_STYLES: Record<EscrowRow['status'], { label: string; className: string }> = {
  active: { label: 'Awaiting approvals', className: 'bg-brand-blue/10 text-brand-blue' },
  dispute: { label: 'Dispute raised', className: 'bg-brand-orange/10 text-brand-orange' },
  completed: { label: 'Settled', className: 'bg-brand-green/10 text-brand-green' },
}

function ApprovalRow({
  label,
  address,
  approved,
  highlight,
}: {
  label: string
  address: string
  approved: boolean
  highlight: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold ${
            approved ? 'bg-brand-green text-white' : 'bg-surface-deep text-ink-muted'
          }`}
        >
          {approved ? '✓' : '·'}
        </span>
        <span className="font-medium text-ink">{label}</span>
        <span className="font-mono text-xs text-ink-muted">{shortAddress(address)}</span>
        {highlight && (
          <span className="rounded-full bg-ink px-2 py-0.5 text-[0.6rem] font-semibold text-white">
            you
          </span>
        )}
      </div>
      <span className={`text-xs font-semibold ${approved ? 'text-brand-green' : 'text-ink-muted'}`}>
        {approved ? 'approved' : 'waiting'}
      </span>
    </div>
  )
}

export function EscrowCard({ escrow, account }: { escrow: EscrowRow; account?: string }) {
  const { writeContractAsync } = useWriteContract()
  const { toast, send, dismiss, busy, isConfirming } = useTxToast()

  const status = STATUS_STYLES[escrow.status]
  const isBuyer = Boolean(account && account.toLowerCase() === escrow.buyer.toLowerCase())
  const isSeller = Boolean(account && account.toLowerCase() === escrow.seller.toLowerCase())
  const isArbiter = Boolean(account && account.toLowerCase() === escrow.arbiter.toLowerCase())
  const settled = escrow.status === 'completed'
  const hasFunds = escrow.balance > 0n

  const act = (write: () => Promise<`0x${string}`>) => {
    void send(write)
  }

  const raiseDispute = () => {
    if (!window.confirm('Raise a dispute? Releases pause until the arbiter resolves it.'))
      return
    act(() =>
      writeContractAsync({ address: escrow.address, abi: ESCROW_ABI, functionName: 'raiseDispute' }),
    )
  }

  const resolve = (forSeller: boolean) => {
    const who = forSeller ? 'the seller' : 'the buyer'
    if (!window.confirm(`Resolve in favor of ${who}? This pays out immediately.`)) return
    act(() =>
      writeContractAsync({
        address: escrow.address,
        abi: ESCROW_ABI,
        functionName: 'resolveDispute',
        args: [forSeller],
      }),
    )
  }

  const approve = (role: 'Buyer' | 'Seller') => {
    act(() =>
      writeContractAsync({
        address: escrow.address,
        abi: ESCROW_ABI,
        functionName: role === 'Buyer' ? 'approveByBuyer' : 'approveBySeller',
      }),
    )
  }

  const disabled = busy || isConfirming

  return (
    <article className="panel p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">
            {formatEth(escrow.amount)} <span className="text-lg text-ink-muted">ETH</span>
          </p>
          <p className="mt-1 font-mono text-xs text-ink-muted">{escrow.address}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-xs">
        <div>
          <p className="text-ink-muted">Buyer {isBuyer && '· you'}</p>
          <p className="mt-1 font-medium text-ink">{shortAddress(escrow.buyer)}</p>
        </div>
        <div>
          <p className="text-ink-muted">Seller {isSeller && '· you'}</p>
          <p className="mt-1 font-medium text-ink">{shortAddress(escrow.seller)}</p>
        </div>
        <div>
          <p className="text-ink-muted">Arbiter {isArbiter && '· you'}</p>
          <p className="mt-1 font-medium text-ink">{shortAddress(escrow.arbiter)}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 rounded-2xl bg-[#f6f8fb] p-4">
        <ApprovalRow
          label="Buyer"
          address={escrow.buyer}
          approved={escrow.buyerApproved}
          highlight={isBuyer}
        />
        <ApprovalRow
          label="Seller"
          address={escrow.seller}
          approved={escrow.sellerApproved}
          highlight={isSeller}
        />
        <div className="flex items-center justify-between border-t border-line pt-2.5 text-sm">
          <span className="text-ink-muted">Locked balance</span>
          <span className="font-semibold text-ink">{formatEth(escrow.balance)} ETH</span>
        </div>
      </div>

      {settled ? (
        <p className="mt-4 text-center text-sm text-ink-muted">
          Funds have left the contract — this escrow is done.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2.5">
          {(isBuyer || isSeller) && (
            <>
              <button
                type="button"
                className="btn-dark flex-1"
                disabled={disabled || (isBuyer ? escrow.buyerApproved : escrow.sellerApproved)}
                onClick={() => approve(isBuyer ? 'Buyer' : 'Seller')}
              >
                {isBuyer
                  ? escrow.buyerApproved
                    ? 'Buyer approved'
                    : 'Approve release'
                  : escrow.sellerApproved
                    ? 'Seller approved'
                    : 'Approve release'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                disabled={disabled || escrow.isDisputeRaised}
                onClick={raiseDispute}
              >
                {escrow.isDisputeRaised ? 'Disputed' : 'Raise dispute'}
              </button>
            </>
          )}

          {isArbiter && escrow.isDisputeRaised && hasFunds && (
            <>
              <button
                type="button"
                className="btn-dark flex-1"
                disabled={disabled}
                onClick={() => resolve(true)}
              >
                Pay seller
              </button>
              <button
                type="button"
                className="btn-ghost flex-1"
                disabled={disabled}
                onClick={() => resolve(false)}
              >
                Refund buyer
              </button>
            </>
          )}

          {!isBuyer && !isSeller && !isArbiter && (
            <span className="rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted">
              Read-only — connected wallet has no role here
            </span>
          )}
        </div>
      )}

      {toast && <TxToast toast={toast} onDismiss={dismiss} />}
    </article>
  )
}
