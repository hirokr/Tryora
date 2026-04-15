import { NextRequest } from "next/server";

import { proxyWithFallback } from "../../_utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  return proxyWithFallback(
    `/api/search/product/${productId}`,
    `/api/search/${productId}`,
    {
      method: "GET",
    },
  );
}
