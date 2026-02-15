import { ThemeProvider } from "./theme-provider";
import UploaderLayout from "./UploadThing-provider";

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
				{children}
			</ThemeProvider>
        </UploaderLayout>
		</>
	);
}
