# LP Terminal

Real-time Uniswap V3 LP position scanner — track status, range, and ownership,
straight from on-chain data. No subgraph or archive node required.

**Live demo:** https://lp-terminal-eight.vercel.app

## What this is

Uniswap doesn't provide a built-in way to see every LP position in a given pool at
once — the NonfungiblePositionManager (NFPM) tracks positions globally by tokenId,
not per-pool. This project solves that by scanning on-chain event logs directly and
reconstructing:

- Every LP position in a target pool (Token ID, Owner, Tick Range, Liquidity)
- Live status per position: **Active** (in range), **Out of range**, or **Closed**
- Current pool price and token balances

All of this is computed from raw on-chain events, without relying on a subgraph or
an archive-node-only historical state call.

## Uniswap Integration

This is the core of the project — see these files for the actual integration:

- **[`src/scripts/fetchData.ts`](./src/scripts/fetchData.ts)** — scans the
  [NonfungiblePositionManager](https://docs.uniswap.org/contracts/v3/reference/periphery/NonfungiblePositionManager)
  contract's `Transfer`, `IncreaseLiquidity`, and `DecreaseLiquidity` events to
  discover every position and compute net liquidity, and cross-references the pool
  contract's own `Mint` event (matched by transaction hash) to recover each
  position's `tickLower`/`tickUpper` — data that isn't available in any single NFPM
  event.
- **Pool used for this demo:** `0x52e65B17fB6E5BA00Ed806f37Afcd2DaA50271Ca`
  (ETH/USDG, 0.01% fee tier, Uniswap V3 on Robinhood Chain)
- **[`@uniswap/v3-sdk`](https://github.com/Uniswap/v3-sdk)** is used for
  tick-to-price conversion (`tickToPrice`) so ranges display as human-readable
  prices instead of raw tick integers.

See [`FEEDBACK.md`](./FEEDBACK.md) for details on specific challenges encountered
while integrating with the Uniswap stack.

## Tech stack

- **Frontend:** Next.js, React, TypeScript
- **On-chain data:** ethers.js, `@uniswap/v3-sdk`
- **Storage:** Supabase (Postgres)
- **Deployment:** Vercel

## Architecture

- `src/scripts/` — standalone Node/TypeScript scripts that scan the blockchain
  and write results to Supabase. Run offline/on-demand, not part of the Next.js
  request path.
- `src/app/`, `src/components/` — the Next.js frontend, reading only from Supabase
  (via the `anon` key, read-only under Row Level Security).

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To re-run the on-chain data scan (requires an RPC URL and Supabase service role key):

```bash
npx tsx src/scripts/fetchData.ts
```

## Note on data freshness

The displayed dataset is a snapshot scanned from a specific block range, not a live
feed — this is a deliberate choice for demo reliability. The exact scanned range is
shown in the UI ("Data from ... to ... UTC").