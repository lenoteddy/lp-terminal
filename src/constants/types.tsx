export type DateInputType = string | number | Date;

export interface PoolDataType {
	token0: {
		symbol: string;
		balance: string;
		decimals: number;
	};
	token1: {
		symbol: string;
		balance: string;
		decimals: number;
	};
	price: number;
	startBlockTimestamp: DateInputType;
	endBlockTimestamp: DateInputType;
}

export interface PositionDataType {
	poolAddress: string;
	tokenId: number;
	owner: string | null;
	tickLower: number | null;
	tickUpper: number | null;
	liquidity: string;
	priceLower?: number;
	priceUpper?: number;
	status?: "active" | "out-of-range" | "closed";
}

export interface PositionsApiResponseType {
	status: string;
	result: PositionDataType[];
}

export interface PoolHeaderProps {
	token0Symbol: string;
	token1Symbol: string;
	token0IconUrl?: string;
	token1IconUrl?: string;
	chainName: string;
	chainIconUrl?: string;
	version: string; // e.g. "v3"
	feeTier: string; // e.g. "0.01%"
	poolAddress: string;
}

export interface UsePaginationResult<T> {
	currentPage: number;
	totalPages: number;
	pageItems: T[];
	goToPage: (page: number) => void;
	nextPage: () => void;
	prevPage: () => void;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface PaginationControlsProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}
