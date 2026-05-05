"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ForgotPasswordCard } from "./_components/ForgotPasswordCard";

export default function ForgotPasswordPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");

	return (
		<div className="flex min-h-full items-center justify-center px-2 py-6">
			<ForgotPasswordCard
				email={email}
				onEmailChange={setEmail}
				onSubmit={(event) => {
					event.preventDefault();
					const trimmedEmail = email.trim();
					if (trimmedEmail) {
						sessionStorage.setItem("authEmail", trimmedEmail);
					}
					router.push(`/auth/email_verify?email=${encodeURIComponent(trimmedEmail)}`);
				}}
			/>
		</div>
	);
}
