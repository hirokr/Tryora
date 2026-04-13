"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/ui/submitButton";
import { signUp } from "@/lib/auth/auth";

export default function SignUpForm() {
	const [state, action] = useActionState(signUp, undefined);
	const [showPassword, setShowPassword] = useState(false);

	return (
		<div
			className='min-h-[86vh] flex flex-col rounded-3xl overflow-hidden'
			style={{
				background:
					"radial-gradient(1200px 600px at 20% 0%, #22103a 0%, #140b24 45%, #0d0b18 100%)",
			}}
		>
			<header className='flex items-center justify-between px-6 md:px-14 py-4'>
				<Link href='/' className='flex items-center gap-2'>
					<div
						className='h-8 w-8 rounded-lg flex items-center justify-center'
						style={{ background: "linear-gradient(145deg, #8b3cf7, #6d28d9)" }}
					>
						<svg width='18' height='18' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
							<path d='M14 2L16.5 10.5L25 8L18.5 14L25 20L16.5 17.5L14 26L11.5 17.5L3 20L9.5 14L3 8L11.5 10.5L14 2Z' fill='white' />
						</svg>
					</div>
					<span className='text-white font-semibold text-xl tracking-tight'>Tryora</span>
				</Link>
				<div className='text-sm text-gray-400'>
					Already have an account?{" "}
					<Link href='/auth/signin' className='text-purple-400 hover:text-purple-300 font-medium transition-colors'>
						Log in
					</Link>
				</div>
			</header>

			<main className='flex-1 flex items-center justify-center px-25 pb-6'>
				<div className='w-full max-w-[900px] flex flex-col lg:flex-row items-start justify-center gap-8'>
					<div
						className='w-full max-w-[340px] rounded-3xl p-5'
						style={{
							backgroundColor: "rgba(37, 27, 55, 0.85)",
							border: "1px solid #3a2f52",
							boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
						}}
					>
						<h1 className='text-3xl font-serif text-white mb-3 leading-tight'>Join Tryora</h1>
						<p className='text-gray-400 mb-10 text-sm leading-relaxed'>
							Create your account to unlock advanced AI avatar
							<br />
							generation.
						</p>

						<form className='space-y-5' action={action}>
							{state?.message && (
								<p className='text-sm text-red-400'>{state.message}</p>
							)}
							<div>
								<Label htmlFor='name' className='block text-sm text-gray-300 mb-2'>
									Full Name
								</Label>
								<div className='relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500'>
										<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
											<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
											<circle cx='12' cy='7' r='4' />
										</svg>
									</span>
									<Input
										id='name'
										name='name'
										type='text'
										placeholder='e.g. Alex Mercer'
										className='w-full pl-10 pr-4 py-3 rounded-2xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all'
										style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
									/>
								</div>
							</div>
							{state?.error?.name && (
								<p className='text-sm text-red-400'>{state.error.name[0]}</p>
							)}

							<div>
								<Label htmlFor='email' className='block text-sm text-gray-300 mb-2'>
									Email Address
								</Label>
								<div className='relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500'>
										<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
											<rect width='20' height='16' x='2' y='4' rx='2' />
											<path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
										</svg>
									</span>
									<Input
										id='email'
										name='email'
										type='email'
										placeholder='alex@example.com'
										className='w-full pl-10 pr-4 py-3 rounded-2xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all'
										style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
									/>
								</div>
							</div>
							{state?.error?.email && (
								<p className='text-sm text-red-400'>{state.error.email[0]}</p>
							)}

							<div>
								<Label htmlFor='phone' className='block text-sm text-gray-300 mb-2'>
									Phone Number
								</Label>
								<div className='relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500'>
										<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
											<rect width='14' height='20' x='5' y='2' rx='2' ry='2' />
											<path d='M12 18h.01' />
										</svg>
									</span>
									<Input
										id='phone'
										name='phone'
										type='tel'
										placeholder='+1 (555) 000-0000'
										className='w-full pl-10 pr-4 py-3 rounded-2xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all'
										style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
									/>
								</div>
							</div>

							<div>
								<Label htmlFor='password' className='block text-sm text-gray-300 mb-2'>
									Password
								</Label>
								<div className='relative'>
									<span className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500'>
										<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
											<rect width='18' height='11' x='3' y='11' rx='2' ry='2' />
											<path d='M7 11V7a5 5 0 0 1 10 0v4' />
										</svg>
									</span>
									<Input
										id='password'
										name='password'
										type={showPassword ? "text" : "password"}
										placeholder=''
										className='w-full pl-10 pr-11 py-3 rounded-2xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all'
										style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
									/>
									<button
										type='button'
										onClick={() => setShowPassword((prev) => !prev)}
										className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors'
									>
										<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
											<path d='M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z' />
											<circle cx='12' cy='12' r='3' />
										</svg>
									</button>
								</div>
							</div>
							{state?.error?.password && (
								<p className='text-sm text-red-400'>{state.error.password[0]}</p>
							)}

							<SubmitButton className='w-full h-10 rounded-2xl text-white font-semibold text-sm mt-2 bg-[#8b3cf7] hover:bg-[#7b2fe0]'>
								Create Account
							</SubmitButton>
						</form>
					</div>

					<div className='hidden lg:flex lg:w-[340px] rounded-3xl p-5 flex-col gap-6' style={{ backgroundColor: "rgba(37, 27, 55, 0.85)", border: "1px solid #3a2f52" }}>
						<div>
							<p className='text-xs font-semibold tracking-[0.25em] uppercase text-purple-400'>Creator Onboarding</p>
							<h2 className='text-white font-semibold text-2xl mt-3'>Build your digital presence with Tryora</h2>
						</div>

						<div className='space-y-4 min-h-[170px]'>
							<p className='typewriter-line line-1 text-sm text-gray-300'>Your avatar, tailored to your style language.</p>
							<p className='typewriter-line line-2 text-sm text-gray-300'>Studio-grade rendering powered by AI precision.</p>
							<p className='typewriter-line line-3 text-sm text-gray-300'>Launch looks faster with creator-first workflows.</p>
						</div>

						<div className='rounded-2xl p-4' style={{ backgroundColor: "#0f0c22", border: "1px solid #2a2540" }}>
							<p className='text-gray-400 text-sm leading-relaxed'>
								From concept to virtual runway, Tryora helps you move from idea to impact without compromising aesthetic quality.
							</p>
						</div>
					</div>
				</div>
			</main>

			<footer className='flex items-center justify-center py-3 gap-2 border-t border-white/5'>
				<svg width='16' height='16' viewBox='0 0 28 28' fill='none' xmlns='http://www.w3.org/2000/svg'>
					<path d='M14 2L16.5 10.5L25 8L18.5 14L25 20L16.5 17.5L14 26L11.5 17.5L3 20L9.5 14L3 8L11.5 10.5L14 2Z' fill='#a855f7' />
				</svg>
				<span className='text-gray-500 text-sm'>Powered by Gemini</span>
			</footer>

			<style jsx>{`
				.typewriter-line {
					overflow: hidden;
					white-space: nowrap;
					width: 0;
					border-right: 2px solid #8b3cf7;
					animation-name: typing;
					animation-duration: 1.8s;
					animation-timing-function: steps(46, end);
					animation-fill-mode: forwards;
					animation-iteration-count: 1;
				}

				.line-1 {
					animation-delay: 0s;
				}

				.line-2 {
					animation-delay: 2.1s;
				}

				.line-3 {
					animation-delay: 4.2s;
				}

				@keyframes typing {
					0% {
						width: 0;
					}
					100% {
						width: 100%;
					}
				}
			`}</style>
		</div>
	);
}
