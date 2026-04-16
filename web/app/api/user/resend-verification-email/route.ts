import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";

export async function POST() {
  const response = await authFetch(`${BACKEND_URL}/api/user/resend-verification-email`, {
    method: "POST",
  });

  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}
