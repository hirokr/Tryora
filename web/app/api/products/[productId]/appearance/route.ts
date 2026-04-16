import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";
import { NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const body = await req.json().catch(() => ({}));
  const { productId } = await params;

  const response = await authFetch(
    `${BACKEND_URL}/api/products/${productId}/appearance`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
