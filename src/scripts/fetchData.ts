import "dotenv/config";
import PoolsHelper from "@/helpers/pools";

async function main() {
	console.log("Fetching data...");
	await PoolsHelper.fetchData();
	await PoolsHelper.calcPositionPrice();
	await PoolsHelper.calcPositionLiquidity();
	await PoolsHelper.calcPositionStatus();
	console.log("Data fetching and calculations complete.");
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
