import React, { PropsWithChildren } from "react";

const AuthLayout = ({ children }: PropsWithChildren) => {
	return (
		<main className=' h-dvh flex items-center justify-center'>
			{children}
		</main>
	);
};

export default AuthLayout;
