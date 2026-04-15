"use client";

import { useActionState, useRef, useState } from "react";

import { signIn } from "@/lib/auth/auth";

import SignInForm from "./SignInForm";

export default function SignInPage() {
	const [state, action] = useActionState(signIn, undefined);
	const [showPassword, setShowPassword] = useState(false);
	const emailInputRef = useRef<HTMLInputElement | null>(null);

	return (
		<SignInForm
			state={state}
			action={action}
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
