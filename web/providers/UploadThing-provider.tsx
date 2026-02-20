import { ourFileRouter } from "@/app/api/uploadthing/core";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

export default function UploaderLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang='en'>
			<body>
				<NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
				{children}
			</body>
		</html>
	);
}
