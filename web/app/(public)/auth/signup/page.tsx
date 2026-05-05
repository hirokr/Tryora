"use client";

import { useActionState, useState } from "react";

import { signUp } from "@/lib/auth/auth";

import SignUpForm from "./SignUpForm";

export default function SignUpPage() {
	const [state, action] = useActionState(signUp, undefined);
	const [showPassword, setShowPassword] = useState(false);

	return (
		<SignUpForm
			state={state}
			action={action}
			showPassword={showPassword}
			onTogglePassword={() => setShowPassword((prev) => !prev)}
		/>
	);
}
