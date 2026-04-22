"use client";

import Link from "next/link";
import type { RefObject } from "react";
import { BACKEND_URL } from "@/constants/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/ui/submitButton";

type SignInFormProps = {
	state: any;
	action: (formData: FormData) => void;
	redirectTo: string;
	showPassword: boolean;
	onTogglePassword: () => void;
	emailInputRef: RefObject<HTMLInputElement | null>;
	onPersistEmail: () => void;
};

const SignInForm = ({
	state,
	action,
	redirectTo,
	showPassword,
	onTogglePassword,
	emailInputRef,
	onPersistEmail,
}: SignInFormProps) => {

	return (
		<main className='flex min-h-full flex-col items-center justify-center px-4 py-6'>
				<div
					className='w-full max-w-[340px] rounded-3xl p-5'
					style={{
						backgroundColor: "rgba(37, 27, 55, 0.85)",
						border: "1px solid #3a2f52",
						boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
					}}
				>
					<h1 className='text-3xl font-serif text-white mb-2 leading-tight'>Welcome Back</h1>
					<p className='text-slate-400 mb-7 text-sm'>Enter your credentials to access your account</p>

					<form
						className='space-y-5'
						action={action}
						onSubmit={onPersistEmail}
					>
						<input type='hidden' name='redirectTo' value={redirectTo} />
						{state?.message && (
							<p className='text-sm text-red-400'>{state.message}</p>
						)}
						<div>
							<Label htmlFor='email' className='block text-sm text-white mb-2'>
								Email
							</Label>
							<Input
								ref={emailInputRef}
								id='email'
								name='email'
								type='email'
								placeholder='name@example.com'
								className='w-full px-4 py-3 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all'
								style={{ backgroundColor: "#312845", border: "1px solid #44365e" }}
							/>
						</div>
						{state?.error?.email && (
							<p className='text-sm text-red-400'>{state.error.email[0]}</p>
						)}

						<div>
							<div className='flex items-center justify-between mb-2'>
								<Label htmlFor='password' className='block text-sm text-white'>
									Password
								</Label>
								<Link href='/auth/forgot_pass' className='text-xs text-purple-400 transition-colors hover:text-purple-300'>
									Forgot Password?
								</Link>
							</div>
							<div className='relative'>
								<Input
									id='password'
									name='password'
									type={showPassword ? "text" : "password"}
									placeholder='••••••••'
									className='w-full px-4 py-3 pr-11 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all'
									style={{ backgroundColor: "#312845", border: "1px solid #44365e" }}
								/>
								<button
									type='button'
									onClick={onTogglePassword}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors'
								>
									<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
										<path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z' />
										<circle cx='12' cy='12' r='3' />
									</svg>
								</button>
							</div>
						</div>
						{state?.error?.password && (
							<p className='text-sm text-red-400'>{state.error.password[0]}</p>
						)}

						<SubmitButton className='w-full h-10 rounded-2xl text-white font-semibold text-sm mt-1 bg-[#8b3cf7] hover:bg-[#7b2fe0]'>
							Login
						</SubmitButton>

						<a
							href={`${BACKEND_URL}/api/auth/google`}
							className='w-full h-10 mt-2 rounded-2xl border border-[#6b5a86] text-slate-100 text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-300 hover:bg-white hover:text-black'
						>
							Continue with Google
						</a>
					</form>

					<div className='my-6 h-px w-full' style={{ backgroundColor: "#3a2f52" }}></div>
					<p className='text-center text-sm text-slate-400'>
						Don&apos;t have an account?{" "}
						<Link href='/auth/signup' className='text-purple-400 hover:text-purple-300 font-semibold'>
							Sign up
						</Link>
					</p>
				</div>

				<div
					className='mt-5 rounded-full px-4 py-2 text-[10px] tracking-[0.22em] uppercase text-slate-400 flex items-center gap-2'
					style={{ border: "1px solid #3a2f52", backgroundColor: "rgba(37, 27, 55, 0.65)" }}
				>
					<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='#8b3cf7' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
						<rect width='18' height='11' x='3' y='11' rx='2' ry='2' />
						<path d='M7 11V7a5 5 0 0 1 10 0v4' />
					</svg>
					Secure Authentication
				</div>
			</main>
	);
};

export default SignInForm;
