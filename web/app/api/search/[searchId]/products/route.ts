import { NextRequest } from "next/server";

import { proxySearchRequest } from "../../_utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ searchId: string }> },
) {
  const { searchId } = await params;

  return proxySearchRequest(`/api/search/${searchId}/products`, {
    method: "GET",
  });
}
