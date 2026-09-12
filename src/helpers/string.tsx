import { DateInputType } from "@/constants/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function abbreviateNumber(value: number) {
	const units = [
		{ suffix: "T", threshold: 1e12 },
		{ suffix: "B", threshold: 1e9 },
		{ suffix: "M", threshold: 1e6 },
		{ suffix: "K", threshold: 1e3 },
	];
	for (const { suffix, threshold } of units) {
		if (value >= threshold) {
			const scaled = value / threshold;
			const rounded = Math.round(scaled * 10) / 10;
			return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}${suffix}`;
		}
	}
	return value % 1 === 0 ? value.toFixed(0) : value.toFixed(2);
}

function toDate(input: DateInputType): Date {
	if (input instanceof Date) return input;
	if (typeof input === "number") return new Date(input * 1000); // unix timestamp in seconds -> ms
	// string: could be a numeric timestamp string, or a SQL-style datetime string
	if (/^\d+$/.test(input)) return new Date(Number(input) * 1000);
	return new Date(input.replace(" ", "T") + "Z");
}

const formatTokenAmount = (numberStr: string, decimals: number) => {
	const big = BigInt(numberStr);
	const divisor = BigInt(10) ** BigInt(decimals);
	const intPart = big / divisor;
	const remainder = big % divisor;
	const fraction = Number(remainder) / Number(divisor);
	const value = Number(intPart) + fraction;
	return abbreviateNumber(value);
};

const formatUSD = (n: number, withSign = true, withDollar = true) => {
	const sign = n < 0 ? "-" : "+";
	const abs = Math.abs(n);
	return `${n === 0 ? "" : withSign ? sign : ""}${withDollar ? "$" : ""}${abs.toLocaleString()}`;
};

const formatLabel = (str: string): string => {
	return str.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
};

const formatDateTime = (date: DateInputType): string => {
	const d = toDate(date);
	const month = MONTHS[d.getUTCMonth()];
	const day = d.getUTCDate();
	const hours = String(d.getUTCHours()).padStart(2, "0");
	const minutes = String(d.getUTCMinutes()).padStart(2, "0");
	return `${month} ${day}, ${hours}:${minutes} UTC`;
};

const formatDateRange = (fromDate: DateInputType, toDate_: DateInputType): string => {
	const from = toDate(fromDate);
	const to = toDate(toDate_);
	const sameDay = from.getUTCFullYear() === to.getUTCFullYear() && from.getUTCMonth() === to.getUTCMonth() && from.getUTCDate() === to.getUTCDate();
	if (sameDay) {
		const month = MONTHS[from.getUTCMonth()];
		const day = from.getUTCDate();
		const startTime = `${String(from.getUTCHours()).padStart(2, "0")}:${String(from.getUTCMinutes()).padStart(2, "0")}`;
		const endTime = `${String(to.getUTCHours()).padStart(2, "0")}:${String(to.getUTCMinutes()).padStart(2, "0")}`;
		return `${month} ${day}, ${startTime} to ${endTime} UTC`;
	}
	return `${formatDateTime(from)} - ${formatDateTime(to)}`;
};

const shortenAddress = (address: string, chars = 4): string => {
	return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
};

const StringHelper = {
	formatTokenAmount,
	formatUSD,
	formatLabel,
	formatDateTime,
	formatDateRange,
	shortenAddress,
};

export default StringHelper;
