import { NextRequest } from "next/server";

import { proxySearchRequest } from "../../_utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  return proxySearchRequest(`/api/search/product/${productId}`, {
    method: "GET",
  });
}
