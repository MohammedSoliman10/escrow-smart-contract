import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { shortAddress } from '../lib/format'
import { activeChain } from '../lib/wagmi'

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount()
  const { connectors, connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  if (!isConnected) {
    const connector = connectors[0]
    return (
      <button
        type="button"
        className="btn-dark"
        disabled={!connector || isPending}
        onClick={() => connector && connect({ connector })}
        title={connector ? 'Connect an injected wallet (MetaMask, Rabby…)' : 'No browser wallet detected'}
      >
        {isPending ? 'Connecting…' : 'Connect wallet'}
      </button>
    )
  }

  if (chainId !== activeChain.id) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-brand-orange/50 bg-brand-orange/10 px-4 py-2 text-xs font-semibold text-brand-orange transition hover:bg-brand-orange/15"
        disabled={isSwitching}
        onClick={() => switchChain({ chainId: activeChain.id })}
      >
        {isSwitching ? 'Switching…' : `Switch to ${activeChain.name}`}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-xs font-medium">
        {shortAddress(address)}
      </span>
      <button
        type="button"
        onClick={() => disconnect()}
        className="text-xs font-medium text-ink-muted transition hover:text-ink"
      >
        Disconnect
      </button>
    </div>
  )
}
