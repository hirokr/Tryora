import { getSession } from "@/lib/auth/session";

import WardrobePageClient from "./_components/WardrobePageClient";

export default async function WardrobePage() {
  const session = await getSession();
  const userId = session?.user?.id ?? null;

  return <WardrobePageClient userId={userId} />;
} // This file defines a server-side rendered page component for the "Wardrobe" section of the Tryora application. It uses an asynchronous function to fetch the user's session information and extract the user ID. The component then renders the `WardrobePageClient` component, passing the user ID as a prop. This setup allows the page to be personalized based on the authenticated user's data, enabling features such as displaying the user's saved wardrobe items or allowing them to manage their virtual closet.
