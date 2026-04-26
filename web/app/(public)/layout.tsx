import { PropsWithChildren } from "react";

const publicLayout = ({ children }: PropsWithChildren) => {
	return <main className='flex-1 px-4 py-6 md:px-6 md:py-8'>{children}</main>;
};


export default publicLayout;
