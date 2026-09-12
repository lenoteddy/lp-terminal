import { UsePaginationResult, PaginationControlsProps } from "@/constants/types";
import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize: number = 20): UsePaginationResult<T> {
	const [currentPage, setCurrentPage] = useState(1);

	const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

	const pageItems = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return items.slice(start, start + pageSize);
	}, [items, currentPage, pageSize]);

	const goToPage = (page: number) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

	return {
		currentPage,
		totalPages,
		pageItems,
		goToPage,
		nextPage: () => goToPage(currentPage + 1),
		prevPage: () => goToPage(currentPage - 1),
		hasNext: currentPage < totalPages,
		hasPrev: currentPage > 1,
	};
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
	if (totalPages <= 1) return null;
	const pages: (number | "...")[] = [1];
	if (currentPage > 3) pages.push("...");
	for (let p = Math.max(2, currentPage - 1); p <= Math.min(totalPages - 1, currentPage + 1); p++) pages.push(p);
	if (currentPage < totalPages - 2) pages.push("...");
	if (totalPages > 1) pages.push(totalPages);

	const buttonStyle = (active = false): React.CSSProperties => ({
		padding: "6px 12px",
		borderRadius: "6px",
		border: "1px solid var(--border, #e0e0e0)",
		background: active ? "var(--surface-1, #f2f2f2)" : "transparent",
		fontWeight: active ? 600 : 400,
		cursor: "pointer",
		fontSize: "14px",
	});

	return (
		<>
			<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "16px 0" }}>
				<button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={{ ...buttonStyle(), opacity: currentPage === 1 ? 0.4 : 1 }}>
					Prev
				</button>
				{pages.map((p, i) =>
					p === "..." ? (
						<span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "var(--text-secondary, #999)" }}>
							...
						</span>
					) : (
						<button key={p} onClick={() => onPageChange(p)} style={buttonStyle(p === currentPage)}>
							{p}
						</button>
					),
				)}
				<button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ ...buttonStyle(), opacity: currentPage === totalPages ? 0.4 : 1 }}>
					Next
				</button>
				<span style={{ marginLeft: "12px", fontSize: "13px", color: "var(--text-secondary, #999)" }}>
					Page {currentPage} of {totalPages}
				</span>
			</div>
		</>
	);
}
