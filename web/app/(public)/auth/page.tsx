// "use client";

// import { useState, useActionState } from "react";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import SubmitButton from "@/components/ui/submitButton";
// import Link from "next/link";
// import { ArrowLeft } from "lucide-react";
// // import { forgotPassword, resetPassword } from "@/lib/auth/auth";
// const forgotPassword = async (prevState: any, formData: FormData) => {
// 	return {
// 		message:
// 			"If an account with that email exists, a reset link has been sent.",
// 	};
// };

// const resetPassword = async (prevState: any, formData: FormData) => {
// 	return {
// 		message: "Your password has been successfully reset.",
// 	};
// };

// type Step = "forgot" | "reset" | "success";

// const PasswordRecoveryFlow = () => {
// 	const [step, setStep] = useState<Step>("forgot");

// 	const [forgotState, forgotAction] = useActionState(
// 		async (prevState: any, formData: FormData) => {
// 			const result = await forgotPassword(prevState, formData);
// 			if (!result?.error) {
// 				setStep("reset");
// 			}
// 			return result;
// 		},
// 		undefined,
// 	);

// 	const [resetState, resetAction] = useActionState(
// 		async (prevState: any, formData: FormData) => {
// 			const result = await resetPassword(prevState, formData);
// 			if (!result?.error) {
// 				setStep("success");
// 			}
// 			return result;
// 		},
// 		undefined,
// 	);

// 	return (
// 		<div className='w-full max-w-md rounded-xl shadow-2xl overflow-hidden darK:bg-background'>
// 			<div className='h-1.5 w-full bg-primary/30'>
// 				<div
// 					className={`h-full bg-primary transition-all duration-300 ${
// 						step === "forgot" ? "w-1/3" : step === "reset" ? "w-2/3" : "w-full"
// 					}`}
// 				/>
// 			</div>

// 			<div className='p-8 flex flex-col gap-6'>
// 				{step === "forgot" && (
// 					<form action={forgotAction} className='flex flex-col gap-4'>
// 						<div className='text-center space-y-2'>
// 							<h3 className='text-2xl font-bold'>Forgot Password?</h3>
// 							<p className='text-sm text-slate-500 dark:text-[#ab9db9]'>
// 								Enter your email to receive a reset link.
// 							</p>
// 						</div>

// 						{forgotState?.message && (
// 							<p className='text-sm text-red-500'>{forgotState.message}</p>
// 						)}

// 						<div>
// 							<Label htmlFor='email'>Email Address</Label>
// 							<Input
// 								id='email'
// 								name='email'
// 								type='email'
// 								placeholder='name@example.com'
// 							/>
// 						</div>

// 						{forgotState?.error?.email && (
// 							<p className='text-sm text-red-500'>{forgotState.error.email}</p>
// 						)}

// 						<SubmitButton>Send Reset Link</SubmitButton>
// 						<Link href='/auth/signin' className='text-sm  text-center'>
// 							<ArrowLeft className='linkIcons inline mr-1' /> Back to Sign In
// 						</Link>
// 					</form>
// 				)}

// 				{step === "reset" && (
// 					<form action={resetAction} className='flex flex-col gap-4'>
// 						<div className='text-center space-y-2'>
// 							<h3 className='text-2xl font-bold'>Set New Password</h3>
// 							<p className='text-sm text-slate-500 dark:text-[#ab9db9]'>
// 								Your new password must be different from previous ones.
// 							</p>
// 						</div>

// 						{resetState?.message && (
// 							<p className='text-sm text-red-500'>{resetState.message}</p>
// 						)}

// 						<div>
// 							<Label htmlFor='password'>New Password</Label>
// 							<Input id='password' name='password' type='password' />
// 						</div>

// 						{resetState?.error?.password && (
// 							<div className='text-sm text-red-500'>
// 								<ul>
// 									{resetState.error.password.map((err: string) => (
// 										<li key={err}>{err}</li>
// 									))}
// 								</ul>
// 							</div>
// 						)}

// 						<div>
// 							<Label htmlFor='confirmPassword'>Confirm Password</Label>
// 							<Input
// 								id='confirmPassword'
// 								name='confirmPassword'
// 								type='password'
// 							/>
// 						</div>

// 						<SubmitButton>Update Password</SubmitButton>
// 					</form>
// 				)}

// 				{step === "success" && (
// 					<div className='flex flex-col items-center text-center gap-4 py-6'>
// 						<h3 className='text-2xl font-bold'>Password Reset Successful</h3>
// 						<p className='text-sm text-slate-500 dark:text-[#ab9db9]'>
// 							Your password has been updated.
// 						</p>
// 						<button
// 							onClick={() => setStep("forgot")}
// 							className='h-11 px-4 rounded-lg bg-primary text-white font-semibold'
// 						>
// 							Return to Login
// 						</button>
// 					</div>
// 				)}
// 			</div>
// 		</div>
// 	);
// };

// export default PasswordRecoveryFlow;

import React from "react";

const page = () => {
	return <div>page</div>;
};

export default page;
