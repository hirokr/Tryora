"use client";

import { useRef, useState } from "react";
import type { RefObject } from "react";
import { Poppins } from "next/font/google";

import { BACKEND_URL } from "@/constants/constants";
import { gsap, useGSAP } from "@/lib/gsap";
import AuthSplitLayout from "@/components/auth/signin/AuthSplitLayout";
import RegistrationCard from "@/components/auth/signin/RegistrationCard";
import WelcomePanel from "@/components/auth/signin/WelcomePanel";

type SignInFormProps = {
	state: any;
	action: (formData: FormData) => void;
	redirectTo: string;
	showPassword: boolean;
	onTogglePassword: () => void;
	emailInputRef: RefObject<HTMLInputElement | null>;
	onPersistEmail: () => void;
};

const poppins = Poppins({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const SignInForm = ({
	state,
	action,
	redirectTo,
	showPassword,
	onTogglePassword,
	emailInputRef,
	onPersistEmail,
}: SignInFormProps) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const [isSwapApplied, setIsSwapApplied] = useState(false);
	const [isAnimating, setIsAnimating] = useState(false);

	useGSAP(
		() => {
			const timeline = gsap.timeline();

			timeline.from(
				"[data-left-panel]",
				{
					opacity: 0,
					x: -40,
					duration: 0.6,
				},
				0,
			);

			timeline.from(
				"[data-right-panel]",
				{
					opacity: 0,
					x: 40,
					duration: 0.6,
				},
				0,
			);

			timeline.from("[data-reg-card]", {
				opacity: 0,
				y: 24,
				duration: 0.7,
			});

			timeline.from(
				"[data-welcome-panel]",
				{
					opacity: 0,
					x: 30,
					duration: 0.8,
				},
				"-=0.4",
			);

			timeline.from(
				"[data-field]",
				{
					opacity: 0,
					y: 12,
					duration: 0.5,
					stagger: 0.08,
				},
				"-=0.3",
			);

			timeline.from(
				"[data-social]",
				{
					opacity: 0,
					y: 10,
					duration: 0.4,
				},
				"-=0.2",
			);
		},
		{ scope: rootRef },
	);

	const handleSwap = () => {
		if (!rootRef.current || isAnimating) {
			return;
		}

		const leftPanel =
			rootRef.current.querySelector<HTMLElement>("[data-left-panel]");
		const rightPanel =
			rootRef.current.querySelector<HTMLElement>("[data-right-panel]");

		if (!leftPanel || !rightPanel) {
			return;
		}

		const leftWidth = leftPanel.offsetWidth;
		const rightWidth = rightPanel.offsetWidth;
		const nextSwap = !isSwapApplied;

		setIsAnimating(true);

		const leftTarget = nextSwap ? rightWidth : -rightWidth;
		const rightTarget = nextSwap ? -leftWidth : leftWidth;

		gsap.to([leftPanel, rightPanel], { clearProps: "transform" });

		gsap.to(leftPanel, {
			x: leftTarget,
			duration: 0.3,
			ease: "power2.out",
		});

		gsap.to(rightPanel, {
			x: rightTarget,
			duration: 0.3,
			ease: "power2.out",
			onComplete: () => {
				setIsSwapApplied(nextSwap);
				gsap.set([leftPanel, rightPanel], { clearProps: "transform" });
				setIsAnimating(false);
			},
		});
	};

	return (
		<div ref={rootRef} className={poppins.className}>
			<AuthSplitLayout
				swap={isSwapApplied}
				left={
					<RegistrationCard
						state={state}
						action={action}
						redirectTo={redirectTo}
						showPassword={showPassword}
						onTogglePassword={onTogglePassword}
						emailInputRef={emailInputRef}
						onPersistEmail={onPersistEmail}
						googleHref={`${BACKEND_URL}/api/auth/google`}
					/>
				}
				right={
					<WelcomePanel
						title='Welcome Back!'
						subtitle='Ready to start fresh? Create a new account in seconds.'
						actionLabel={isSwapApplied ? "Back" : "Sign Up"}
						onAction={handleSwap}
					/>
				}
			/>
		</div>
	);
};

export default SignInForm;
