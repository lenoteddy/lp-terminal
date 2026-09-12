import { PoolDataType, PositionDataType } from "@/constants/types";
import { useEffect, useMemo, useState } from "react";
import StringHelper from "@/helpers/string";
import API from "@/helpers/api";
import PoolHeader from "./PoolHeader";
import config from "@/constants/config";
import PositionsTable from "./PositionsTable";

export default function PositionsView() {
	const [poolData, setPoolData] = useState<PoolDataType | null>(null);
	const [positions, setPositions] = useState<PositionDataType[]>([]);
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const selected = useMemo<PositionDataType>(() => positions.find((p) => p.tokenId === selectedId) ?? positions[0], [selectedId, positions]);
	const rangePct = (() => {
		if (!selected) return 0;
		if (!selected.priceUpper || !selected.priceLower) return 0;
		if (!poolData?.price) return 0;
		const span = selected.priceUpper - selected.priceLower;
		const pos = ((poolData.price - selected.priceLower) / span) * 100;
		return Math.min(100, Math.max(0, pos));
	})();

	useEffect(() => {
		API.fetchPoolData()
			.then((data) => setPoolData(data))
			.catch((err) => {
				console.error("Failed to fetch pool data:", err);
			});

		API.fetchPositions()
			.then((data) => setPositions(data))
			.catch((err) => {
				console.error("Failed to fetch positions:", err);
			});
	}, []);

	return (
		<div className="lp-root">
			<div className="lp-topbar">
				<PoolHeader
					token0Symbol="ETH"
					token1Symbol="USDG"
					token0IconUrl="/icons/eth-logo.png"
					token1IconUrl="/icons/usdg-logo.png"
					chainName="Robinhood Chain"
					chainIconUrl="/icons/robinhood-logo.png"
					version="v3"
					feeTier="0.01%"
					poolAddress={config.POOL_ADDRESS}
				/>
				<div className="text-left md:ml-auto md:text-right">
					<div className="lp-datetime-info-label">Data from</div>
					<div className="lp-datetime-info-value">{poolData ? StringHelper.formatDateRange(poolData.startBlockTimestamp, poolData.endBlockTimestamp) : "..."}</div>
				</div>
			</div>
			<div className="lp-stats">
				<div className="lp-stat">
					<div className="lp-stat__label">{poolData ? poolData?.token0.symbol : "..."} balance in Pool</div>
					<div className="lp-stat__value">{poolData ? StringHelper.formatTokenAmount(poolData?.token0.balance, poolData?.token0.decimals) : "..."}</div>
				</div>
				<div className="lp-stat">
					<div className="lp-stat__label">{poolData ? poolData?.token1.symbol : "..."} balance in Pool</div>
					<div className="lp-stat__value">{poolData ? StringHelper.formatTokenAmount(poolData?.token1.balance, poolData?.token1.decimals) : "..."}</div>
				</div>
				<div className="lp-stat">
					<div className="lp-stat__label">Current Price</div>
					<div className="lp-stat__value">{poolData ? `1 ${poolData?.token0.symbol} = ${StringHelper.formatUSD(poolData?.price, false, false)} ${poolData?.token1.symbol}` : "..."}</div>
				</div>
			</div>
			{selectedId !== null && (
				<div className="lp-detail">
					<div className="lp-detail__head flex items-center justify-between">
						<div className="lp-detail__title">Position of Token ID #{selected.tokenId}</div>
						<span className={`lp-pill lp-pill--${selected.status}`}>{StringHelper.formatLabel(String(selected.status))}</span>
					</div>
					<div className="lp-range-labels">
						<span>Lower: {selected.priceLower?.toLocaleString()}</span>
						<span className="lp-range-labels__current">Current: {poolData ? poolData?.price.toLocaleString() : "..."}</span>
						<span>Upper: {selected.priceUpper?.toLocaleString()}</span>
					</div>
					<div className={`lp-range-track ${selected.status}`}>
						<div className="lp-range-marker" style={{ left: `calc(${rangePct}% - 1px)` }} />
					</div>
					<div className="lp-metrics">
						<div>
							<div className="lp-metric__label">Owner</div>
							<div className="font-bold">{selected.owner}</div>
						</div>
					</div>
				</div>
			)}
			<PositionsTable positions={positions} selectedId={selectedId} setSelectedId={setSelectedId} />
		</div>
	);
}
