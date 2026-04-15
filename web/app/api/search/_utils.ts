import { BACKEND_URL } from "@/constants/constants";
import { authFetch, type FetchOptions } from "@/lib/auth/authFetch";

export async function proxySearchRequest(pathname: string, options: FetchOptions = {}) {
  const response = await authFetch(`${BACKEND_URL}${pathname}`, options);
  const payload = await response.text();

  return new Response(payload, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") || "application/json",
    },
  });
}

export async function proxyWithFallback(
  primaryPathname: string,
  fallbackPathname: string,
  options: FetchOptions = {},
) {
  const primaryResponse = await authFetch(`${BACKEND_URL}${primaryPathname}`, options);

  if (primaryResponse.status !== 404) {
    const payload = await primaryResponse.text();

    return new Response(payload, {
      status: primaryResponse.status,
      headers: {
        "Content-Type": primaryResponse.headers.get("content-type") || "application/json",
      },
    });
  }

  const fallbackResponse = await authFetch(`${BACKEND_URL}${fallbackPathname}`, options);
  const fallbackPayload = await fallbackResponse.text();

  return new Response(fallbackPayload, {
    status: fallbackResponse.status,
    headers: {
      "Content-Type": fallbackResponse.headers.get("content-type") || "application/json",
    },
  });
}
