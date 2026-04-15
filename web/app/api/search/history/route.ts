import { proxySearchRequest } from "../_utils";

export async function GET() {
  return proxySearchRequest("/api/search/history", {
    method: "GET",
  });
}
