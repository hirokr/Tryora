import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";
import { deleteSession } from "@/lib/auth/session";
import { redirect, RedirectType } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	const response = await authFetch(`${BACKEND_URL}/auth/signout`, {
		method: "POST",
	});
	if (response.ok) {
	}
	await deleteSession();

	redirect("/", RedirectType.push);
}
