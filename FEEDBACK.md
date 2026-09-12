# Feedback for Uniswap

## Why this project applicable for this prize

I built a real-time LP position scanner that reads directly from Uniswap V3's NonfungiblePositionManager and pool contracts, reconstructing position state, tick ranges, and status entirely from raw event logs — without a subgraph or archive node. This includes correctly matching NFPM mint events to pool Mint events to resolve tick ranges, and computing accurate position status (active in-range, out-of-range, or closed) purely from on-chain history.

## Biggest blocker

Historical state access — calling `positions()`/`slot0()` at a past block needs an archive node, which our RPC provider didn't support (`"metadata not found"` error). I reworked the data layer to reconstruct everything from raw event logs instead (`Transfer`, `IncreaseLiquidity`, `DecreaseLiquidity`, plus the pool's `Mint` event for tick ranges) — slower to build, but removed the archive-node dependency entirely.

## What support was missing, or could have been better

Better documentation on data-access limitations for newer/smaller chains would help — nothing in Uniswap's or the RPC provider's docs flagged upfront that historical `positions()`/`slot0()` calls need an archive node, so I only discovered this mid-build via a runtime error. A note on this, or a suggested event-replay pattern as an alternative, would have saved real time.

We'd also highlight: there's no built-in way to enumerate all LP positions for a given pool — the NFPM tracks positions by tokenId globally, not per-pool, so discovering "every position in pool X" means scanning all NFPM Transfer/mint events and filtering by matching token0/token1/fee afterward. A documented pattern or helper for this would save time for anyone building pool-level analytics.

Additionally, `tickLower`/`tickUpper` aren't included in the NFPM's `IncreaseLiquidity`/`DecreaseLiquidity` events — they only appear in the pool contract's own `Mint` event. I had to correlate the NFPM mint transaction hash with the pool's `Mint` event to recover this. A note on this relationship in the NFPM reference docs would help other builders avoid the same trial-and-error.

## Additional feedback

Overall a great bounty to build for — the NFPM/pool contract interfaces were straightforward once I understood the event structure. The one recurring theme across our feedback: more documentation around what's only available via live calls vs. what needs to be reconstructed from events (tick ranges, historical state) would help builders avoid the same trial-and-error I went through.