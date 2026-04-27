
import RootLayoutShell from "@/components/RootLayoutShell";
import { getSession } from "@/lib/auth/session";

export default async function MainProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getSession();
	const isAuthenticated = Boolean(session?.user);

	return (
		<>
			<RootLayoutShell enableSidebar={isAuthenticated}>{children}</RootLayoutShell>
		</>
	);
} // Main layout provider for user pages
