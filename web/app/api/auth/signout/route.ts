import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "@/lib/auth/authFetch";
import { deleteSession } from "@/lib/auth/session";
import { redirect, RedirectType } from "next/navigation";

export async function GET() {
  await authFetch(`${BACKEND_URL}/api/auth/signout`, {
    method: "GET",
  });

  await deleteSession();

  redirect("/", RedirectType.push);
}
