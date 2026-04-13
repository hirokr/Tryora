"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");

	return (
		<div
			className="min-h-[86vh] flex flex-col rounded-3xl overflow-hidden"
			style={{
				background: "radial-gradient(1200px 600px at 20% 0%, #22103a 0%, #140b24 45%, #0d0b18 100%)",
			}}
		>
			<header className="flex items-center justify-between px-6 md:px-14 py-4">
				<Link href="/" className="flex items-center gap-2">
					<div
						className="h-8 w-8 rounded-lg flex items-center justify-center"
						style={{ background: "linear-gradient(145deg, #8b3cf7, #6d28d9)" }}
					>
						<svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M14 2L16.5 10.5L25 8L18.5 14L25 20L16.5 17.5L14 26L11.5 17.5L3 20L9.5 14L3 8L11.5 10.5L14 2Z" fill="white" />
						</svg>
					</div>
					<span className="text-white font-semibold text-xl tracking-tight">Tryora</span>
				</Link>
			</header>

			<main className="flex-1 flex items-center justify-center px-6 pb-8">
				<div
					className="w-full max-w-[380px] rounded-3xl p-6"
					style={{
						backgroundColor: "rgba(37, 27, 55, 0.85)",
						border: "1px solid #3a2f52",
						boxShadow: "0 16px 40px rgba(0,0,0,0.34)",
					}}
				>
					<h1 className="text-3xl font-serif text-white mb-3">Forgot Password</h1>
					<p className="text-gray-400 mb-6 text-sm leading-relaxed">
						Enter your email and we&apos;ll send you a link to reset your password.
					</p>

					<form
						className="space-y-5"
						onSubmit={(e) => {
							e.preventDefault();
							if (email.trim()) {
								sessionStorage.setItem("authEmail", email.trim());
							}
							router.push(`/auth/email_verify?email=${encodeURIComponent(email.trim())}`);
						}}
					>
						<div>
							<label htmlFor="email" className="block text-sm text-gray-300 mb-2">
								Email Address
							</label>
							<input
								id="email"
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="alex@example.com"
								className="w-full px-4 py-3 rounded-2xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
								style={{ backgroundColor: "#16132a", border: "1px solid #2a2540" }}
							/>
						</div>

						<button
							type="submit"
							className="w-full h-10 rounded-2xl text-white font-semibold text-sm bg-[#8b3cf7] hover:bg-[#7b2fe0] transition-colors"
						>
							Send Reset Link
						</button>
					</form>

					<Link
						href="/auth/signin"
						className="mt-5 inline-flex items-center justify-center w-full rounded-2xl border border-[#6b5a86] py-2.5 text-sm font-semibold text-slate-100 hover:bg-white hover:text-black transition-colors"
					>
						Back to Sign In
					</Link>
				</div>
			</main>
		</div>
	);
}
