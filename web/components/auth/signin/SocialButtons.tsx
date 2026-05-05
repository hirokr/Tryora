type SocialButtonsProps = {
	googleHref: string;
};

const SocialButton = ({
	label,
	href,
	text,
}: {
	label: string;
	href?: string;
	text: string;
}) => {
	const sharedClassName =
		"flex h-10 w-10 items-center justify-center rounded-full border border-border text-sm font-semibold text-muted-foreground transition hover:border-ring hover:text-foreground";

	if (href) {
		return (
			<a href={href} aria-label={label} className={sharedClassName}>
				{text}
			</a>
		);
	}

	return (
		<button type='button' aria-label={label} className={sharedClassName}>
			{text}
		</button>
	);
};

export default function SocialButtons({ googleHref }: SocialButtonsProps) {
	return (
		<div className='flex items-center gap-3' data-social>
			<SocialButton label='Google' href={googleHref} text='G' />
			<SocialButton label='Facebook' text='f' />
			<SocialButton label='GitHub' text='GH' />
			<SocialButton label='LinkedIn' text='in' />
		</div>
	);
}
