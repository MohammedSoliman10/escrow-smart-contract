import { deployedFactoryAddress, escrowAbi, escrowFactoryAbi } from '../generated/contracts'

export const ESCROW_ABI = escrowAbi
export const FACTORY_ABI = escrowFactoryAbi

const envFactory = import.meta.env.VITE_FACTORY_ADDRESS as string | undefined

/**
 * Factory address: `VITE_FACTORY_ADDRESS` env var wins, otherwise the address
 * picked up from Foundry's broadcast artifacts by `npm run sync-abi`.
 * `null` means the factory has not been deployed yet.
 */
export const FACTORY_ADDRESS = ((envFactory || deployedFactoryAddress) ?? null) as `0x${string}` | null
