import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainProvider from "@/providers/Provider";
import { getSession } from "@/lib/auth/session";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Tryora",
	description: "First Try then Buy",
};

<meta name='apple-mobile-web-app-title' content='Tryora' />;

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await getSession();

	return (
		<html lang='en' suppressHydrationWarning>
			<body
				suppressHydrationWarning
				className={`${geistSans.variable} 
				${geistMono.variable} antialiased dark`}
			>
				<MainProvider initialUser={session?.user ?? null}>
					{children}
				</MainProvider>
			</body>
		</html>
	);
}
