# Escrow Smart Contract + Frontend

A minimal two-key escrow contract built with [Foundry](https://book.getfoundry.sh/), plus a React
frontend styled in the *Cirrus* design language (cloudy-sky hero, floating white cards, Inter
Tight / Inter / Instrument Serif).

## How it works

Each deal deploys its own `Escrow` contract funded at creation:

1. The **buyer** creates the escrow through the `EscrowFactory`, sending the ETH with it.
2. **Buyer** and **seller** each call `approve…` — when both have approved, the contract pays
   the **seller** automatically.
3. Either side can `raiseDispute()` — releases pause and the **arbiter** decides with
   `resolveDispute(true)` (pay seller) or `resolveDispute(false)` (refund buyer).

## Project layout

```
src/
  escrow.sol            # single-deal escrow contract
  EscrowFactory.sol     # deploys escrows + registry (getEscrows / escrowsCount)
script/
  DeployEscrowFactory.s.sol
test/
  escrow.t.sol          # 18 tests for the escrow lifecycle
  EscrowFactory.t.sol   # 7 tests for the factory
frontend/               # Vite + React + TS + Tailwind + wagmi
  scripts/sync-abi.mjs  # copies ABIs + deployed address from Foundry artifacts
```

## Contracts

```shell
forge build
forge test
```

### Local deployment (Anvil)

```shell
# terminal 1 — local node
anvil

# terminal 2 — deploy the factory
forge script script/DeployEscrowFactory.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key <anvil-account-0-key> \
  --broadcast
```

## Frontend

```shell
cd frontend
npm install
npm run dev        # runs sync-abi first, then Vite on http://localhost:5173
```

- `/` — landing page: SVG cloud hero with live factory stats, feature grid, how-it-works
  section, footer.
- `/app` — dashboard: connect a wallet, create escrows, watch approvals, raise/resolve
  disputes (role-aware buttons).

### ABI sync

`npm run sync-abi` (also runs automatically before `dev` / `build`) copies the ABIs from
`out/` and the deployed factory address from
`broadcast/DeployEscrowFactory.s.sol/31337/run-latest.json` into
`frontend/src/generated/contracts.ts`.

Override either value with env vars:

```shell
VITE_FACTORY_ADDRESS=0x…   # factory address
VITE_RPC_URL=http://127.0.0.1:8545
```

### Wallet setup (MetaMask)

| Field    | Value                     |
| -------- | ------------------------- |
| Network  | Anvil (local)             |
| RPC URL  | `http://127.0.0.1:8545`   |
| Chain ID | `31337`                   |
| Currency | `ETH`                     |

Import one of Anvil's pre-funded private keys to transact.

## Useful commands

```shell
forge build    # compile
forge test     # run the full test suite
forge fmt      # format Solidity
npm run lint   # oxlint (in frontend/)
```

See the [Foundry book](https://book.getfoundry.sh/) for everything else.
