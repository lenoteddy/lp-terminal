import { usePagination, PaginationControls } from "@/hooks/Pagination";
import { PositionDataType } from "@/constants/types";
import StringHelper from "@/helpers/string";

function PositionsTable({ positions, selectedId, setSelectedId }: { positions: PositionDataType[]; selectedId: number | null; setSelectedId: (id: number | null) => void }) {
	const { pageItems, currentPage, totalPages, goToPage } = usePagination(positions, 20);

	return (
		<div className="lp-table-card">
			<table className="lp-table">
				<thead>
					<tr>
						<th className="text-center">Token ID</th>
						<th className="text-center">Owner</th>
						<th className="text-center">Range</th>
						<th className="text-center">Status</th>
					</tr>
				</thead>
				<tbody>
					{pageItems.map((p) => (
						<tr key={p.tokenId} className={p.tokenId === selectedId ? "selected" : ""} onClick={() => setSelectedId(p.tokenId)}>
							<td className="text-center">{p.tokenId}</td>
							<td className="text-center lp-owner">{StringHelper.shortenAddress(String(p.owner))}</td>
							<td className="text-center">{`${p.priceLower?.toLocaleString()} - ${p.priceUpper?.toLocaleString()}`}</td>
							<td className="text-center">
								<span className={`lp-pill lp-pill--${p.status}`}>{StringHelper.formatLabel(String(p.status))}</span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
		</div>
	);
}

export default PositionsTable;
