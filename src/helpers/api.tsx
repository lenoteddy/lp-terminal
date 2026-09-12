import { PositionDataType, PositionsApiResponseType } from "@/constants/types";

export async function fetchPoolData() {
	const res = await fetch("/api/pools");
	if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
	const data = await res.json();
	if (data.status !== "success") throw new Error("API returned non-success status");
	return data.result;
}

export async function fetchPositions(): Promise<PositionDataType[]> {
	const res = await fetch("/api/positions");
	if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
	const data: PositionsApiResponseType = await res.json();
	if (data.status !== "success") throw new Error("API returned non-success status");
	return data.result;
}

const API = {
	fetchPoolData,
	fetchPositions,
};

export default API;
