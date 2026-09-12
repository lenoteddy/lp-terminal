import { ethers } from "ethers";
import config from "@/constants/config";
import { tickToPrice } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import NonfungiblePositionManager from "@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";

const { RPC_URL, CHAIN_ID, ERC20_ABI, START_BLOCK, END_BLOCK } = config;
const provider = new ethers.JsonRpcProvider(RPC_URL);

async function getBlockTimestamp(): Promise<{ startBlockTimestamp: number | null; endBlockTimestamp: number | null }> {
	const startBlockData = await provider.getBlock(START_BLOCK);
	const endBlockData = await provider.getBlock(END_BLOCK);
	return { startBlockTimestamp: startBlockData?.timestamp ?? null, endBlockTimestamp: endBlockData?.timestamp ?? null };
}

async function getPoolTokens(poolAddress: string): Promise<{ token0: Token; token1: Token }> {
	const pool = new ethers.Contract(poolAddress as string, IUniswapV3PoolABI.abi, provider);
	const [token0Addr, token1Addr] = await Promise.all([pool.token0(), pool.token1()]);
	const token0Contract = new ethers.Contract(token0Addr, ERC20_ABI, provider);
	const token1Contract = new ethers.Contract(token1Addr, ERC20_ABI, provider);
	const [decimals0, decimals1, symbol0, symbol1] = await Promise.all([token0Contract.decimals(), token1Contract.decimals(), token0Contract.symbol(), token1Contract.symbol()]);
	const token0 = new Token(CHAIN_ID, token0Addr, Number(decimals0), symbol0);
	const token1 = new Token(CHAIN_ID, token1Addr, Number(decimals1), symbol1);
	return { token0, token1 };
}

async function getPoolBalances(poolAddress: string) {
	const { token0, token1 } = await getPoolTokens(poolAddress);
	const token0Contract = new ethers.Contract(token0.address, ERC20_ABI, provider);
	const token1Contract = new ethers.Contract(token1.address, ERC20_ABI, provider);
	const [balance0, balance1] = await Promise.all([token0Contract.balanceOf(poolAddress), token1Contract.balanceOf(poolAddress)]);
	return {
		token0: {
			symbol: token0.symbol,
			balance: balance0.toString(),
			decimals: token0.decimals,
		},
		token1: {
			symbol: token1.symbol,
			balance: balance1.toString(),
			decimals: token1.decimals,
		},
	};
}

async function getPoolSlot0(poolAddress: string): Promise<{ sqrtPriceX96: bigint; tick: number; rawPrice: number }> {
	const pool = new ethers.Contract(poolAddress as string, IUniswapV3PoolABI.abi, provider);
	const slot0 = await pool.slot0();
	const rawPrice = Number(slot0[0]) ** 2 / 2 ** 192;
	return {
		sqrtPriceX96: slot0[0],
		tick: slot0[1],
		rawPrice: rawPrice,
	};
}

async function getPositionLiquidity(tokenId: number) {
	const nfpm = new ethers.Contract(config.NFPM_ADDRESS, NonfungiblePositionManager.abi, provider);
	try {
		const position = await nfpm.positions(tokenId);
		const liquidity = BigInt(position.liquidity.toString());
		return liquidity.toString();
	} catch {
		return "0";
	}
}

async function getPositionStatus(currentTick: number, position: { liquidity: string; tickLower: number | null; tickUpper: number | null }) {
	const { liquidity, tickLower, tickUpper } = position;
	if (liquidity === "0" || BigInt(liquidity) === BigInt(0)) return "closed";
	if (tickLower === null || tickUpper === null) return "closed";
	const inRange = currentTick >= tickLower && currentTick < tickUpper;
	return inRange ? "active" : "out-of-range";
}

async function getPositionPrice(token0: Token, token1: Token, tickLower: number, tickUpper: number) {
	const priceLower = tickToPrice(token0, token1, tickLower).toSignificant(6);
	const priceUpper = tickToPrice(token0, token1, tickUpper).toSignificant(6);
	return { priceLower, priceUpper };
}

const Web3Helper = {
	getBlockTimestamp,
	getPoolTokens,
	getPoolBalances,
	getPoolSlot0,
	getPositionLiquidity,
	getPositionStatus,
	getPositionPrice,
};

export default Web3Helper;
