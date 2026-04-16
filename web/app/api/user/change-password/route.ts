import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  const response = await authFetch(`${BACKEND_URL}/api/user/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}
