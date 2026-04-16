import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  const response = await authFetch(`${BACKEND_URL}/api/products/${productId}`, {
    method: "GET",
  });

  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}
