import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);

	const accessToken = searchParams.get("accessToken");
	const refreshToken = searchParams.get("refreshToken");
	const userId = searchParams.get("userId");
	const name = searchParams.get("name");
	const email = searchParams.get("email");
	const avatarUrl = searchParams.get("avatarUrl") || undefined;

	if (!accessToken || !refreshToken || !userId || !name || !email) {
		throw new Error("Invalid query parameters");
	}
	await createSession({
		user: {
			id: userId,
			name,
			email,
			avatarUrl,
		},
		accessToken,
		refreshToken,
	});

	redirect("/");
}
