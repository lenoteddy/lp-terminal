import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PositionDataType } from "@/constants/types";
import config from "@/constants/config";

let supabase: SupabaseClient;

function getSupabaseClient(): SupabaseClient {
	if (!supabase) supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
	return supabase;
}

function mapRowToPositionDataType(row: Record<string, unknown>): PositionDataType {
	return {
		poolAddress: row.pool_address as string,
		tokenId: row.token_id as number,
		owner: row.owner as string,
		tickLower: row.tick_lower as number,
		tickUpper: row.tick_upper as number,
		liquidity: row.liquidity as string,
		priceLower: (row.price_lower as number) ?? null,
		priceUpper: (row.price_upper as number) ?? null,
		status: (row.position_status as "active" | "out-of-range" | "closed") ?? null,
	};
}

function mapPositionUpdatesToRow(updates: Partial<PositionDataType>): Record<string, unknown> {
	const row: Record<string, unknown> = {};
	if (updates.poolAddress !== undefined) row.pool_address = updates.poolAddress;
	if (updates.tokenId !== undefined) row.token_id = updates.tokenId;
	if (updates.owner !== undefined) row.owner = updates.owner;
	if (updates.tickLower !== undefined) row.tick_lower = updates.tickLower;
	if (updates.tickUpper !== undefined) row.tick_upper = updates.tickUpper;
	if (updates.liquidity !== undefined) row.liquidity = updates.liquidity;
	if (updates.priceLower !== undefined) row.price_lower = updates.priceLower;
	if (updates.priceUpper !== undefined) row.price_upper = updates.priceUpper;
	if (updates.status !== undefined) row.position_status = updates.status;
	return row;
}

async function getPositions(poolAddress?: string): Promise<PositionDataType[]> {
	const client = getSupabaseClient();
	let query = client.from("positions").select("*").order("token_id", { ascending: true });
	if (poolAddress) query = query.eq("pool_address", poolAddress);
	const { data, error } = await query;
	if (error) {
		console.error("[getPositionsByPool] Failed to fetch positions:", error.message);
		return [];
	}
	return (data ?? []).map(mapRowToPositionDataType);
}

async function insertPositions(position: PositionDataType): Promise<PositionDataType | null>;
async function insertPositions(positions: PositionDataType[]): Promise<PositionDataType[]>;
async function insertPositions(input: PositionDataType | PositionDataType[]): Promise<PositionDataType | PositionDataType[] | null> {
	const client = getSupabaseClient();
	const isBulk = Array.isArray(input);
	const positions = isBulk ? input : [input];

	if (positions.length === 0) return isBulk ? [] : null;

	const rows = positions.map((position) => ({
		pool_address: position.poolAddress,
		token_id: position.tokenId,
		owner: position.owner,
		tick_lower: position.tickLower,
		tick_upper: position.tickUpper,
		liquidity: position.liquidity,
	}));

	const { data, error } = await client.from("positions").upsert(rows, { onConflict: "pool_address,token_id" }).select();

	if (error) {
		console.error("[savePosition] Failed to save position(s):", error.message);
		return isBulk ? [] : null;
	}

	return isBulk ? data : (data?.[0] ?? null);
}

async function updatePositions(items: Array<{ poolAddress: string; tokenId: number; updates: Partial<PositionDataType> }>): Promise<PositionDataType[]> {
	const client = getSupabaseClient();
	const results = await Promise.all(
		items.map(({ poolAddress, tokenId, updates }) => client.from("positions").update(mapPositionUpdatesToRow(updates)).eq("pool_address", poolAddress).eq("token_id", tokenId).select()),
	);
	const failed = results.filter((r) => r.error);
	if (failed.length) {
		console.error("[updatePositions] Failed to update", failed.length, "of", items.length, "positions:", failed[0].error?.message);
	}
	return results.filter((r) => !r.error && r.data).flatMap((r) => (r.data ?? []).map(mapRowToPositionDataType));
}

const Database = {
	getPositions,
	insertPositions,
	updatePositions,
};

export default Database;
