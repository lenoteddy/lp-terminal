import { PoolHeaderProps } from "@/constants/types";
import StringHelper from "@/helpers/string";
import Image from "next/image";

export default function PoolHeader({ token0Symbol, token1Symbol, token0IconUrl, token1IconUrl, chainName, chainIconUrl, version, feeTier, poolAddress }: PoolHeaderProps) {
	return (
		<div className="flex items-center gap-3">
			<div className="relative w-24 h-16 shrink-0">
				<div className="absolute w-16 h-16 border-2 border-white rounded-full overflow-hidden bg-[#627EEA] z-10">
					{token0IconUrl && <Image src={token0IconUrl} alt={token0Symbol} width={64} height={64} className="object-cover" />}
				</div>
				<div className="absolute w-16 h-16 border-2 border-white rounded-full overflow-hidden bg-[#3D4A1E] left-7.5">
					{token1IconUrl && <Image src={token1IconUrl} alt={token1Symbol} width={64} height={64} className="object-cover" />}
				</div>
			</div>
			<div>
				<div className="flex items-center gap-2">
					<span className="text-[28px] font-medium">
						{token0Symbol} / {token1Symbol}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="flex items-center gap-1 text-sm text-(--text-secondary,#666)">
						{chainIconUrl && <Image src={chainIconUrl} alt={chainName} width={16} height={16} className="rounded" />}
						{chainName}
					</span>
					<span className="text-[13px] text-(--text-secondary,#666) bg-(--surface-1,#f2f2f2) rounded-md py-0.5 px-2">{version}</span>
					<span className="text-[13px] text-(--text-secondary,#666) bg-(--surface-1,#f2f2f2) rounded-md py-0.5 px-2">{feeTier}</span>
					<span className="hidden md:block text-[13px] text-(--text-secondary,#666) font-mono">{StringHelper.shortenAddress(poolAddress)}</span>
				</div>
			</div>
		</div>
	);
}
