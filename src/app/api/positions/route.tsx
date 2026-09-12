import Database from "@/helpers/database";

export async function GET() {
	const results = await Database.getPositions();

	return Response.json({
		status: "success",
		result: results,
	});
}
