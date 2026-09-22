import { Link } from 'react-router-dom'
import { anvil } from 'wagmi/chains'
import { useAccount } from 'wagmi'
import { Footer } from '../components/Footer'
import { Navbar } from '../components/Navbar'
import { CreateEscrowForm } from '../components/escrow/CreateEscrowForm'
import { EscrowCard } from '../components/escrow/EscrowCard'
import { useEscrows } from '../hooks/useEscrows'
import { FACTORY_ADDRESS } from '../lib/contracts'

const SETUP_COMMANDS = `anvil   # terminal 1
forge script script/DeployEscrowFactory.s.sol \\
  --rpc-url http://127.0.0.1:8545 \\
  --private-key <anvil-key-0> --broadcast   # terminal 2
cd frontend && npm run sync-abi   # then reload`

function SkeletonCard() {
  return (
    <div className="panel animate-pulse p-6">
      <div className="flex justify-between">
        <div className="h-7 w-36 rounded-lg bg-surface-deep" />
        <div className="h-6 w-32 rounded-full bg-surface-deep" />
      </div>
      <div className="mt-5 h-4 w-52 rounded bg-surface-deep" />
      <div className="mt-6 h-24 rounded-2xl bg-surface-deep" />
      <div className="mt-4 h-9 w-full rounded-full bg-surface-deep" />
    </div>
  )
}

export default function Dashboard() {
  const { address, isConnected, chainId } = useAccount()
  const { data: rows, isLoading, isError, error, refetch, isFetching } = useEscrows()

  const wrongChain = isConnected && chainId !== anvil.id

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 pt-28 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-ink-muted">
              Create a deal, watch approvals land, resolve disputes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-ink-soft">
              <span
                className={`mr-2 inline-block h-2 w-2 rounded-full ${
                  FACTORY_ADDRESS ? 'bg-brand-green' : 'bg-brand-orange'
                }`}
              />
              Anvil · 31337
            </span>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => void refetch()}
              disabled={isFetching || !FACTORY_ADDRESS}
            >
              {isFetching ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {!FACTORY_ADDRESS && (
          <div className="mt-8 rounded-3xl border border-brand-orange/40 bg-brand-orange/10 p-6">
            <h2 className="font-display text-lg font-bold text-ink">Factory not deployed yet</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Run the following, then reload — the deploy address is picked up automatically by{' '}
              <code className="rounded bg-card px-1.5 py-0.5 text-xs">npm run sync-abi</code>:
            </p>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink p-4 text-xs leading-relaxed text-white">
              {SETUP_COMMANDS}
            </pre>
          </div>
        )}

        {isConnected && wrongChain && (
          <div className="mt-6 rounded-3xl border border-brand-orange/40 bg-brand-orange/10 p-5 text-sm text-ink-soft">
            Your wallet is on chain {chainId} — switch to{' '}
            <strong>Anvil</strong> (31337) to send transactions. The button in the header does
            it for you.
          </div>
        )}

        {!isConnected && (
          <div className="mt-6 rounded-3xl border border-line bg-card p-5 text-sm text-ink-soft">
            <strong>Read-only mode.</strong> Connect a wallet to create escrows and approve
            releases. MetaMask network:{' '}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs">http://127.0.0.1:8545</code>{' '}
            · chain ID <code className="rounded bg-surface px-1.5 py-0.5 text-xs">31337</code> ·
            currency <code className="rounded bg-surface px-1.5 py-0.5 text-xs">ETH</code>.
          </div>
        )}

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(320px,380px)_1fr]">
          <div className="lg:sticky lg:top-24">
            <CreateEscrowForm />
            <Link
              to="/"
              className="mt-4 block text-center text-sm text-ink-muted transition hover:text-ink"
            >
              ← Back to landing page
            </Link>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">
                Escrows {rows && rows.length > 0 && `(${rows.length})`}
              </h2>
              {FACTORY_ADDRESS && (
                <span className="font-mono text-[0.7rem] text-ink-muted">
                  {FACTORY_ADDRESS}
                </span>
              )}
            </div>

            {!FACTORY_ADDRESS ? (
              <div className="panel p-8 text-center text-sm text-ink-muted">
                The escrow list appears here once the factory is deployed.
              </div>
            ) : isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : isError ? (
              <div className="panel p-8 text-center">
                <p className="text-sm font-semibold text-ink">Can’t reach the local node</p>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Is Anvil running on <span className="font-mono">127.0.0.1:8545</span>?
                </p>
                <p className="mt-1 text-xs text-ink-muted">{String(error?.message ?? '')}</p>
                <button type="button" className="btn-dark mt-5" onClick={() => void refetch()}>
                  Retry
                </button>
              </div>
            ) : rows!.length === 0 ? (
              <div className="panel p-8 text-center">
                <p className="text-sm font-semibold text-ink">No escrows yet</p>
                <p className="mt-1.5 text-sm text-ink-muted">
                  Create the first deal with the form — it deploys its own contract through the
                  factory.
                </p>
              </div>
            ) : (
              rows!.map((escrow) => (
                <EscrowCard key={escrow.address} escrow={escrow} account={address} />
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
