import Link from "next/link";
import type { RefObject } from "react";

import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/ui/submitButton";
import IconInput from "@/components/auth/signin/IconInput";
import SocialButtons from "@/components/auth/signin/SocialButtons";

const userIcon = (
	<svg
		width='16'
		height='16'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.8'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<path d='M20 21a8 8 0 0 0-16 0' />
		<circle cx='12' cy='7' r='4' />
	</svg>
);

const mailIcon = (
	<svg
		width='16'
		height='16'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.8'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<path d='M4 4h16v16H4z' />
		<path d='m22 6-10 7L2 6' />
	</svg>
);

const lockIcon = (
	<svg
		width='16'
		height='16'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.8'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<rect width='18' height='11' x='3' y='11' rx='2' ry='2' />
		<path d='M7 11V7a5 5 0 0 1 10 0v4' />
	</svg>
);

const eyeIcon = (
	<svg
		width='18'
		height='18'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z' />
		<circle cx='12' cy='12' r='3' />
	</svg>
);

type RegistrationCardProps = {
	state: any;
	action: (formData: FormData) => void;
	redirectTo: string;
	showPassword: boolean;
	onTogglePassword: () => void;
	emailInputRef: RefObject<HTMLInputElement | null>;
	onPersistEmail: () => void;
	googleHref: string;
};

export default function RegistrationCard({
	state,
	action,
	redirectTo,
	showPassword,
	onTogglePassword,
	emailInputRef,
	onPersistEmail,
	googleHref,
}: RegistrationCardProps) {
	return (
		<div
			className='w-full max-w-md rounded-[28px] bg-card p-8 shadow-xl'
			data-reg-card
		>
			<div className='mb-8 space-y-2'>
				<span className='text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground'>
					Registration
				</span>
				<h1 className='text-3xl font-semibold text-foreground'>
					Create your account
				</h1>
				<p className='text-sm text-muted-foreground'>
					Start your style journey with Tryora.
				</p>
			</div>

			<form className='space-y-5' action={action} onSubmit={onPersistEmail}>
				<input type='hidden' name='redirectTo' value={redirectTo} />
				{state?.message && (
					<p className='text-sm text-destructive'>{state.message}</p>
				)}

				<IconInput
					id='name'
					name='name'
					label='Username'
					type='text'
					placeholder='TryoraUser'
					autoComplete='username'
					icon={userIcon}
				/>

				<IconInput
					id='email'
					name='email'
					label='Email'
					type='email'
					placeholder='name@example.com'
					autoComplete='email'
					icon={mailIcon}
					inputRef={emailInputRef}
				/>
				{state?.error?.email && (
					<p className='text-sm text-destructive'>{state.error.email[0]}</p>
				)}

				<div data-field>
					<div className='mb-2 flex items-center justify-between'>
						<Label
							htmlFor='password'
							className='text-sm font-medium text-muted-foreground'
						>
							Password
						</Label>
						<Link
							href='/auth/forgot_pass'
							className='text-xs font-medium text-muted-foreground transition hover:text-foreground'
						>
							Forgot Password?
						</Link>
					</div>
					<div className='relative'>
						<span className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
							{lockIcon}
						</span>
						<input
							id='password'
							name='password'
							type={showPassword ? "text" : "password"}
							placeholder='••••••••'
							autoComplete='current-password'
							className='h-11 w-full rounded-xl border border-input bg-card/90 pl-10 pr-10 text-sm text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary'
						/>
						<button
							type='button'
							onClick={onTogglePassword}
							className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground'
							aria-label='Toggle password visibility'
						>
							{eyeIcon}
						</button>
					</div>
				</div>
				{state?.error?.password && (
					<p className='text-sm text-destructive'>{state.error.password[0]}</p>
				)}

				<SubmitButton className='h-11 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'>
					Register
				</SubmitButton>
			</form>

			<div className='mt-7 flex items-center justify-between' data-field>
				<span className='text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground'>
					Or
				</span>
				<SocialButtons googleHref={googleHref} />
			</div>
		</div>
	);
}
