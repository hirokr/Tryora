import type { ReactNode } from "react";

type AuthSplitLayoutProps = {
	left: ReactNode;
	right: ReactNode;
	swap?: boolean;
	className?: string;
};

export default function AuthSplitLayout({
	left,
	right,
	swap = false,
	className,
}: AuthSplitLayoutProps) {
	const leftOrder = swap ? "lg:order-2" : "lg:order-1";
	const rightOrder = swap ? "lg:order-1" : "lg:order-2";
	const rightCurve = swap ? "lg:rounded-r-[120px]" : "lg:rounded-l-[120px]";

	return (
		<main
			className={`min-h-screen bg-background px-6 py-12 ${className ?? ""}`}
		>
			<div className='mx-auto grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[36px] bg-card/70 shadow-2xl backdrop-blur lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]'>
				<div
					className={`flex items-center justify-center px-8 py-12 transition-all duration-300 lg:px-12 ${leftOrder}`}
					data-left-panel
				>
					{left}
				</div>
				<div
					className={`flex items-center justify-center bg-primary px-8 py-12 text-primary-foreground transition-all duration-300 ${rightOrder} ${rightCurve}`}
					data-right-panel
				>
					{right}
				</div>
			</div>
		</main>
	);
}
