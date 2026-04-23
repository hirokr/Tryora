import React, { PropsWithChildren } from "react";

import ProtectedSidebar from "./_components/ProtectedSidebar";

const AuthLayout = ({ children }: PropsWithChildren) => {
	return (
		<>
			<ProtectedSidebar />
			<main className='flex-1 px-4 py-6 md:px-6 md:py-8 xl:pl-72'>
				{children}
			</main>
		</>
	);
};

export default AuthLayout;
