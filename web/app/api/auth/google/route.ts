import { BACKEND_URL } from "@/constants/constants";
import { redirect } from "next/navigation";

export async function GET() {
  redirect(`${BACKEND_URL}/api/auth/google`);
}
