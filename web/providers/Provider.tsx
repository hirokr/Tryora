import GSAPProvider from "./gsapProvider";
import { ThemeProvider } from "./theme-provider";
import UploaderLayout from "./UploadThing-provider";
import { Toaster } from "@/components/ui/sonner";
import TryonJobStatusPanel from "@/components/utility/tryon/TryonJobStatusPanel";
import { AuthProvider } from "@/context/auth.context";
import { TryonSocketProvider } from "@/context/tryonSocket.context";
import { Session } from "@/types/auth";

export default function MainProvider({
	children,
	initialUser,
}: {
	children: React.ReactNode;
	initialUser?: Session["user"] | null;
}) {
	return (
		<>
			<AuthProvider initialUser={initialUser}>
				<TryonSocketProvider>
					<UploaderLayout>
						<ThemeProvider
							attribute='class'
							defaultTheme='system'
							enableSystem
							disableTransitionOnChange
						>
							<GSAPProvider />
							<Toaster richColors position='top-right' />
							<TryonJobStatusPanel />
							{children}
						</ThemeProvider>
					</UploaderLayout>
				</TryonSocketProvider>
			</AuthProvider>
		</>
	);
}
