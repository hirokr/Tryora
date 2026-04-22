import GSAPProvider from "./gsapProvider";
import { ThemeProvider } from "./theme-provider";
import UploaderLayout from "./UploadThing-provider";
import { Toaster } from "@/components/ui/sonner";

export default function MainProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<UploaderLayout>
				<ThemeProvider
					attribute='class'
					defaultTheme='system'
					enableSystem
					disableTransitionOnChange
				>
					<GSAPProvider />
					<Toaster richColors position='top-right' />
					{children}
				</ThemeProvider>
			</UploaderLayout>
		</>
	);
}
