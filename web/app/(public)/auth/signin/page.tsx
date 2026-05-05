"use client";

import { useActionState, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { signIn } from "@/lib/auth/auth";

import SignInForm from "./SignInForm";

export default function SignInPage() {
	const [state, action] = useActionState(signIn, undefined);
	const [showPassword, setShowPassword] = useState(false);
	const emailInputRef = useRef<HTMLInputElement | null>(null);
	const searchParams = useSearchParams();
	const redirectTo = searchParams.get("redirectTo") || "/";

	return (
		<SignInForm
			state={state}
			action={action}
			redirectTo={redirectTo}
			showPassword={showPassword}
			onTogglePassword={() => setShowPassword((prev) => !prev)}
			emailInputRef={emailInputRef}
			onPersistEmail={() => {
				const emailValue = emailInputRef.current?.value?.trim();
				if (emailValue) {
					sessionStorage.setItem("authEmail", emailValue);
				}
			}}
		/>
	);
}
