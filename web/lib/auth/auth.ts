"use server";

import { redirect } from "next/navigation";
import { BACKEND_URL } from "@/constants/constants";
import { LoginFormSchema, SignupFormSchema } from "@/validation/auth.valid";

import { createSession, deleteSession } from "./session";
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
		if (!oldRefreshToken) {
			return null;
		}

		const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
			method: "GET",
		});

		if (!response.ok) {
			console.warn("Refresh token request failed", response.status, response.statusText);
			return null;
		}

		const data = await response.json().catch(() => null);
		return data?.accessToken ?? null;
	} catch (err) {
		console.warn("Refresh token flow failed", err instanceof Error ? err.message : err);
		return null;
	}
};

export async function signOut() {
	try {
		await fetch(`${BACKEND_URL}/api/auth/signout`, {
			method: "GET",
			credentials: "include",
		});
	} catch {
		// Ensure local session is still cleared even when backend is unreachable.
	}

	await deleteSession();
	redirect("/");
}
