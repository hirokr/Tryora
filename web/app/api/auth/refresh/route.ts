import { BACKEND_URL } from "@/constants/constants";

export async function GET() {
  const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
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
