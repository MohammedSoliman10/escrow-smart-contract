import { createConfig, http, injected } from 'wagmi'
import { anvil } from 'wagmi/chains'

const rpcUrl = (import.meta.env.VITE_RPC_URL as string | undefined) ?? 'http://127.0.0.1:8545'

export const config = createConfig({
  chains: [anvil],
  connectors: [injected()],
  transports: {
    [anvil.id]: http(rpcUrl),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
