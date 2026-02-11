import React, { PropsWithChildren } from "react";

const AuthLayout = ({ children }: PropsWithChildren) => {
	return (
		<main className='bg-linear-to-br from-lime-400 to-cyan-400 h-screen flex items-center justify-center'>
			{children}
		</main>
	);
};

export default AuthLayout;
