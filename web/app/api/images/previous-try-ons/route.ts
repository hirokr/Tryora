import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const response = await authFetch(
    `${BACKEND_URL}/api/images/previous-try-ons${req.nextUrl.search}`,
    {
      method: "GET",
    },
  );

  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}
