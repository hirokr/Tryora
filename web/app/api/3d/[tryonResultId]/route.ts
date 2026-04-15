import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tryonResultId: string }> },
) {
  const { tryonResultId } = await params;

  const response = await authFetch(`${BACKEND_URL}/api/3d/${tryonResultId}`, {
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tryonResultId: string }> },
) {
  const { tryonResultId } = await params;

  const response = await authFetch(`${BACKEND_URL}/api/3d/${tryonResultId}`, {
    method: "DELETE",
  });

  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}
