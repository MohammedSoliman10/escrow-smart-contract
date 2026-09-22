import { createConfig, http, injected } from 'wagmi'
import { anvil, sepolia } from 'wagmi/chains'

/**
 * Which chain the app targets: `VITE_CHAIN=sepolia` for hosted/production,
 * anything else (default) for local Anvil. Both chains are registered so the
 * wallet can switch, but `activeChain` is the one the UI assumes.
 */
const chainChoice = (import.meta.env.VITE_CHAIN as string | undefined)?.toLowerCase()

export const activeChain = chainChoice === 'sepolia' ? sepolia : anvil

const localRpc = 'http://127.0.0.1:8545'
const hostedRpc = 'https://ethereum-sepolia-rpc.publicnode.com'

/** `VITE_RPC_URL` overrides the active chain's RPC; inactive chains keep defaults. */
const overrideRpc = import.meta.env.VITE_RPC_URL as string | undefined

const sepoliaRpc = activeChain.id === sepolia.id ? (overrideRpc ?? hostedRpc) : hostedRpc
const anvilRpc = activeChain.id === anvil.id ? (overrideRpc ?? localRpc) : localRpc

// active chain first — wagmi treats chains[0] as the default
const chains = activeChain.id === sepolia.id ? ([sepolia, anvil] as const) : ([anvil, sepolia] as const)

export const config = createConfig({
  chains,
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(sepoliaRpc),
    [anvil.id]: http(anvilRpc),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
