import { NextRequest } from "next/server";

import { proxySearchRequest } from "../_utils";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  return proxySearchRequest("/api/search/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
