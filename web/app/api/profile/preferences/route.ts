import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";
import { NextRequest } from "next/server";

async function proxyPreferences(req: NextRequest, method: "POST" | "PUT") {
  const body = await req.json().catch(() => ({}));

  const response = await authFetch(`${BACKEND_URL}/api/profile/preferences`, {
    method,
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

export async function POST(req: NextRequest) {
  return proxyPreferences(req, "POST");
}

export async function PUT(req: NextRequest) {
  return proxyPreferences(req, "PUT");
}
