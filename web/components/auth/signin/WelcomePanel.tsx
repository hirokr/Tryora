type WelcomePanelProps = {
	title: string;
	subtitle: string;
	actionLabel: string;
	onAction: () => void;
};

export default function WelcomePanel({
	title,
	subtitle,
	actionLabel,
	onAction,
}: WelcomePanelProps) {
	return (
		<div
			className='flex w-full flex-col items-center text-center'
			data-welcome-panel
		>
			<h2 className='text-4xl font-semibold tracking-tight'>{title}</h2>
			<p className='mt-3 max-w-xs text-sm text-primary-foreground/70'>
				{subtitle}
			</p>
			<button
				type='button'
				onClick={onAction}
				className='mt-8 inline-flex h-11 items-center justify-center rounded-full border border-primary-foreground/60 px-8 text-sm font-semibold text-primary-foreground transition hover:border-primary-foreground hover:bg-white/10'
			>
				{actionLabel}
			</button>
		</div>
	);
}
