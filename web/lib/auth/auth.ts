"use server";

import { redirect } from "next/navigation";
import { LoginFormSchema, SignupFormSchema } from "@/validation/auth.valid";

import { createSession } from "./session";
import { BACKEND_URL } from "@/constants/constants";
import { FormState } from "@/types/auth";

export async function signUp(
	state: FormState,
	formData: FormData,
): Promise<FormState> {
	const validationFields = SignupFormSchema.safeParse({
		name: formData.get("name"),
		email: formData.get("email"),
		password: formData.get("password"),
	});

	if (!validationFields.success) {
		return {
			error: validationFields.error.flatten().fieldErrors,
		};
	}
	console.log(`${BACKEND_URL}/api/auth/signup`);

	const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(validationFields.data),
	});
	if (response.ok) {
		redirect("/auth/signin");
	} else
		return {
			message:
				response.status === 409
					? "The user is already existed!"
					: response.statusText,
		};
}

export async function signIn(
	state: FormState,
	formData: FormData,
): Promise<FormState> {
	const validatedFields = LoginFormSchema.safeParse({
		email: formData.get("email"),
		password: formData.get("password"),
	});
	// console.log(validatedFields.data);

	if (!validatedFields.success) {
		return {
			error: validatedFields.error.flatten().fieldErrors,
		};
	}

	const response = await fetch(`${BACKEND_URL}/api/auth/signin`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(validatedFields.data),
	});

	const data = await response.json();
	console.log(data);

	if (response.ok) {
		await createSession({
			user: {
				id: data.user.id,
				name: data.user.name,
				email: data.user.email,
				avatarUrl: data.user?.avatar || undefined,
				emailVerified: data.user.emailVerified,
				isActive: data.user.isActive,
			},
			accessToken: data.accessToken ?? "",
			refreshToken: data.refreshToken ?? "",
		});
		redirect("/");
	} else {
		return {
			message: data?.message || response.statusText,
		};
	}
}

export const refreshToken = async (oldRefreshToken: string) => {
	try {
		const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				refresh: oldRefreshToken,
			}),
		});

		if (!response.ok) {
			throw new Error("Failed to refresh token" + response.statusText);
		}

		const { accessToken, refreshToken } = await response.json();
		// update session with new tokens
		const FRONTEND_URL =
			process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

		const updateRes = await fetch(`${FRONTEND_URL}/api/auth/update`, {
			method: "POST",
			body: JSON.stringify({
				accessToken,
				refreshToken,
			}),
		});
		if (!updateRes.ok) throw new Error("Failed to update the tokens");

		return accessToken;
	} catch (err) {
		console.error("Refresh Token failed:", err);
		return null;
	}
};
