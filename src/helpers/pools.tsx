import { ethers, Contract, EventLog } from "ethers";
import { PositionDataType } from "@/constants/types";
import config from "@/constants/config";
import Database from "@/helpers/database";
import Web3Helper from "@/helpers/web3";
import NonfungiblePositionManager from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";

const { RPC_URL, NFPM_ADDRESS, POOL_ADDRESS, START_BLOCK, END_BLOCK, CHUNK_SIZE } = config;
const provider = new ethers.JsonRpcProvider(RPC_URL);

async function getLogsChunked(contract: Contract, filter: ethers.DeferredTopicFilter, fromBlock: bigint, toBlock: bigint): Promise<EventLog[]> {
	const logs: EventLog[] = [];
	for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE) {
		const end = start + CHUNK_SIZE - BigInt(1) > toBlock ? toBlock : start + CHUNK_SIZE - BigInt(1);
		console.log(`Block ${start} -> ${end}`);
		const chunkLogs = await contract.queryFilter(filter, start, end);
		logs.push(...(chunkLogs as EventLog[]));
	}
	return logs;
}

async function fetchData() {
	const nfpm = new ethers.Contract(NFPM_ADDRESS as string, NonfungiblePositionManager.abi, provider);
	const pool = new ethers.Contract(POOL_ADDRESS as string, IUniswapV3PoolABI.abi, provider);
	const fromBlock = BigInt(START_BLOCK);
	const toBlock = BigInt(END_BLOCK);

	const [mints, increases, decreases, allTransfers, poolMints] = await Promise.all([
		getLogsChunked(nfpm, nfpm.filters.Transfer(ethers.ZeroAddress, null, null), fromBlock, toBlock),
		getLogsChunked(nfpm, nfpm.filters.IncreaseLiquidity(), fromBlock, toBlock),
		getLogsChunked(nfpm, nfpm.filters.DecreaseLiquidity(), fromBlock, toBlock),
		getLogsChunked(nfpm, nfpm.filters.Transfer(), fromBlock, toBlock),
		getLogsChunked(pool, pool.filters.Mint(), fromBlock, toBlock),
	]);

	const tokenIdSet = new Set<string>([
		...mints.map((l) => (l.args as unknown as { tokenId: bigint }).tokenId.toString()),
		...increases.map((l) => (l.args as unknown as { tokenId: bigint }).tokenId.toString()),
		...decreases.map((l) => (l.args as unknown as { tokenId: bigint }).tokenId.toString()),
	]);

	// resolve current owner: last Transfer's "to" address, in block order
	const ownerByToken = new Map<string, string>();
	for (const t of allTransfers) {
		const args = t.args as unknown as { from: string; to: string; tokenId: bigint };
		ownerByToken.set(args.tokenId.toString(), args.to);
	}

	// resolve tick range: match NFPM mint tx hash to the pool's own Mint event
	const poolMintByTx = new Map(poolMints.map((m) => [m.transactionHash, m]));
	const rangeByToken = new Map<string, { tickLower: number; tickUpper: number }>();
	for (const m of mints) {
		const args = m.args as unknown as { tokenId: bigint };
		const poolMint = poolMintByTx.get(m.transactionHash);
		if (poolMint) {
			const poolArgs = poolMint.args as unknown as { tickLower: bigint; tickUpper: bigint };
			rangeByToken.set(args.tokenId.toString(), {
				tickLower: Number(poolArgs.tickLower),
				tickUpper: Number(poolArgs.tickUpper),
			});
		}
	}

	// net liquidity per token: sum(IncreaseLiquidity) - sum(DecreaseLiquidity)
	const liquidityByToken = new Map<string, bigint>();
	for (const e of increases) {
		const args = e.args as unknown as { tokenId: bigint; liquidity: bigint };
		const id = args.tokenId.toString();
		liquidityByToken.set(id, (liquidityByToken.get(id) ?? BigInt(0)) + args.liquidity);
	}
	for (const e of decreases) {
		const args = e.args as unknown as { tokenId: bigint; liquidity: bigint };
		const id = args.tokenId.toString();
		liquidityByToken.set(id, (liquidityByToken.get(id) ?? BigInt(0)) - args.liquidity);
	}

	// return results
	const results: PositionDataType[] = Array.from(tokenIdSet)
		.map((tokenId) => {
			const range = rangeByToken.get(tokenId);
			return {
				poolAddress: POOL_ADDRESS,
				tokenId: Number(tokenId),
				owner: ownerByToken.get(tokenId) ?? null,
				tickLower: range?.tickLower ?? null,
				tickUpper: range?.tickUpper ?? null,
				liquidity: (liquidityByToken.get(tokenId) ?? BigInt(0)).toString(),
			};
		})
		.filter(
			(p): p is PositionDataType & { tickLower: number; tickUpper: number } =>
				p.tickLower !== null && p.tickUpper !== null && ownerByToken.get(p.tokenId.toString()) != "0x0000000000000000000000000000000000000000",
		);

	await Database.insertPositions(results);

	return results;
}

async function calcPositionPrice() {
	const results = await Database.getPositions();
	const poolTokens = await Web3Helper.getPoolTokens(config.POOL_ADDRESS);
	const items = await Promise.all(
		results.map(async (position) => {
			const prices = await Web3Helper.getPositionPrice(poolTokens.token0, poolTokens.token1, position.tickLower ?? 0, position.tickUpper ?? 0);
			return {
				poolAddress: position.poolAddress,
				tokenId: position.tokenId,
				updates: {
					priceLower: Number(prices.priceLower),
					priceUpper: Number(prices.priceUpper),
				},
			};
		}),
	);
	const updated = await Database.updatePositions(items);
	return updated;
}

async function calcPositionLiquidity() {
	const results = await Database.getPositions();
	const items = results.map((position) => {
		const liquidity = BigInt(position.liquidity);
		return {
			poolAddress: position.poolAddress,
			tokenId: position.tokenId,
			updates: {
				liquidity: liquidity.toString(),
			},
		};
	});
	const updated = await Database.updatePositions(items);
	return updated;
}

async function calcPositionStatus() {
	const results = await Database.getPositions();
	const poolSlot0 = await Web3Helper.getPoolSlot0(config.POOL_ADDRESS);
	const items = await Promise.all(
		results.map(async (position) => {
			const status = (await Web3Helper.getPositionStatus(poolSlot0.tick, {
				liquidity: position.liquidity,
				tickLower: position.tickLower,
				tickUpper: position.tickUpper,
			})) as "active" | "out-of-range" | "closed" | undefined;
			return {
				poolAddress: position.poolAddress,
				tokenId: position.tokenId,
				updates: {
					status,
				},
			};
		}),
	);
	const updated = await Database.updatePositions(items);
	return updated;
}

const PoolsHelper = {
	fetchData,
	calcPositionPrice,
	calcPositionLiquidity,
	calcPositionStatus,
};

export default PoolsHelper;
