import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);

	const userId = searchParams.get("id");
	const name = searchParams.get("name");
	const email = searchParams.get("email");
	const avatarUrl = searchParams.get("avatarUrl") || undefined;
	const emailVerified = searchParams.get("emailVerified");
	const isActive = searchParams.get("isActive");

	const accessToken = searchParams.get("accessToken")
	const refreshToken = searchParams.get("refreshToken")

	if (!userId || !name || !email || !accessToken || !refreshToken) {
		throw new Error("Invalid query parameters");
	}

	await createSession({
		user: {
			id: userId,
			name,
			email,
			avatarUrl,
			emailVerified: emailVerified === "true",
			isActive: isActive === "true",
		},
		accessToken,
		refreshToken,
	});


	redirect("/");
}
