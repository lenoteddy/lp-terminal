"use client";

import PositionsView from "@/components/PositionsView";

export default function Home() {
	return (
		<div className="flex flex-col items-center bg-zinc-50 font-sans">
			<main className="w-full max-w-5xl min-h-screen p-8 bg-white">
				<PositionsView />
			</main>
		</div>
	);
}
