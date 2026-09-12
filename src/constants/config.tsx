const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID!);
const RPC_URL = process.env.RPC_URL!;
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NFPM_ADDRESS = process.env.NEXT_PUBLIC_NFPM_ADDRESS!;
const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS!;
const START_BLOCK = Number(process.env.NEXT_PUBLIC_START_BLOCK!);
const END_BLOCK = Number(process.env.NEXT_PUBLIC_END_BLOCK!);
const CHUNK_SIZE = BigInt(process.env.NEXT_PUBLIC_CHUNK_SIZE!);
const ERC20_ABI = ["function decimals() view returns (uint8)", "function symbol() view returns (string)", "function balanceOf(address) view returns (uint256)"];

const config = {
	SUPABASE_URL,
	SUPABASE_SERVICE_ROLE_KEY,
	RPC_URL,
	CHAIN_ID,
	NFPM_ADDRESS,
	POOL_ADDRESS,
	START_BLOCK,
	END_BLOCK,
	CHUNK_SIZE,
	ERC20_ABI,
};

export default config;
