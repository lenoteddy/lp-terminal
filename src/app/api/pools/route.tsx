import Web3Helper from "@/helpers/web3";
import config from "@/constants/config";

export async function GET() {
	const result = await Web3Helper.getPoolBalances(config.POOL_ADDRESS);
	const slot0 = await Web3Helper.getPoolSlot0(config.POOL_ADDRESS);
	const price = slot0.rawPrice * 10 ** (result.token0.decimals - result.token1.decimals);
	const blockTimestamps = await Web3Helper.getBlockTimestamp();

	return Response.json({
		status: "success",
		result: { ...result, ...{ price }, ...blockTimestamps },
	});
}
