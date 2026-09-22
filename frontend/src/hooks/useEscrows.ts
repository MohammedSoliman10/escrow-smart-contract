import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { ESCROW_ABI, FACTORY_ABI, FACTORY_ADDRESS } from '../lib/contracts'

export type EscrowStatus = 'active' | 'dispute' | 'completed'

export interface EscrowRow {
  address: `0x${string}`
  buyer: `0x${string}`
  seller: `0x${string}`
  arbiter: `0x${string}`
  /** Total deal size set at creation. */
  amount: bigint
  /** Current contract balance — 0 means funds already moved. */
  balance: bigint
  buyerApproved: boolean
  sellerApproved: boolean
  isDisputeRaised: boolean
  status: EscrowStatus
  approvals: number
}

export interface EscrowStats {
  created: number
  locked: bigint
  active: number
  disputes: number
  completed: number
}

function derive(row: Omit<EscrowRow, 'status' | 'approvals'>): EscrowRow {
  const approvals = Number(row.buyerApproved) + Number(row.sellerApproved)
  const status: EscrowStatus =
    row.balance === 0n ? 'completed' : row.isDisputeRaised ? 'dispute' : 'active'
  return { ...row, status, approvals }
}

/** Reads every escrow created by the factory, including live balances. */
export function useEscrows() {
  const publicClient = usePublicClient()

  return useQuery<EscrowRow[]>({
    queryKey: ['escrows', FACTORY_ADDRESS],
    enabled: Boolean(publicClient && FACTORY_ADDRESS),
    retry: 1,
    refetchInterval: 12_000,
    queryFn: async () => {
      if (!publicClient || !FACTORY_ADDRESS) return []

      const addresses = (await publicClient.readContract({
        address: FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: 'getEscrows',
      })) as `0x${string}`[]

      return Promise.all(
        addresses.map(async (address) => {
          const [buyer, seller, arbiter, amount, buyerApproved, sellerApproved, isDisputeRaised, balance] =
            await Promise.all([
              publicClient.readContract({ address, abi: ESCROW_ABI, functionName: 'buyer' }),
              publicClient.readContract({ address, abi: ESCROW_ABI, functionName: 'seller' }),
              publicClient.readContract({ address, abi: ESCROW_ABI, functionName: 'arbiter' }),
              publicClient.readContract({ address, abi: ESCROW_ABI, functionName: 'amount' }),
              publicClient.readContract({ address, abi: ESCROW_ABI, functionName: 'buyerApproved' }),
              publicClient.readContract({ address, abi: ESCROW_ABI, functionName: 'sellerApproved' }),
              publicClient.readContract({ address, abi: ESCROW_ABI, functionName: 'isDisputeRaised' }),
              publicClient.getBalance({ address }),
            ])

          return derive({
            address,
            buyer,
            seller,
            arbiter,
            amount,
            balance,
            buyerApproved,
            sellerApproved,
            isDisputeRaised,
          })
        }),
      )
    },
  })
}

export function escrowStats(rows: EscrowRow[]): EscrowStats {
  return {
    created: rows.length,
    locked: rows.reduce((sum, row) => sum + row.balance, 0n),
    active: rows.filter((row) => row.status === 'active').length,
    disputes: rows.filter((row) => row.status === 'dispute').length,
    completed: rows.filter((row) => row.status === 'completed').length,
  }
}
