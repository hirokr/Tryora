import { NextRequest } from "next/server";

import { proxySearchRequest } from "../../_utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const body = await req.json().catch(() => ({}));

  return proxySearchRequest(`/api/search/product-metric/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
