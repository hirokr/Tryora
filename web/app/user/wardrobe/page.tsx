import { getSession } from "@/lib/auth/session";

import WardrobePageClient from "./_components/WardrobePageClient";

export default async function WardrobePage() {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  return <WardrobePageClient userId={userId} />;
}
