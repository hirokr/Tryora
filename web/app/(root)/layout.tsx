import Footer from "@/components/Footer";
import Header from "@/components/Header";
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
			<Header />
			<RootLayoutShell enableSidebar={isAuthenticated}>{children}</RootLayoutShell>
			<Footer />
		</>
	);
}
