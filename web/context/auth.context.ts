"use client";

import {
	createElement,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { Session } from "@/types/auth";

type AuthUser = Session["user"];

type AuthSessionResponse = {
	isAuthenticated: boolean;
	user: AuthUser | null;
	error?: string;
};

type AuthContextValue = {
	user: AuthUser | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	error?: string;
	refreshSession: () => Promise<void>;
	clearSession: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readSession = async (): Promise<AuthSessionResponse> => {
	const response = await fetch("/api/auth/session", {
		method: "GET",
		credentials: "include",
		cache: "no-store",
	});

	if (!response.ok) {
		return {
			isAuthenticated: false,
			user: null,
			error: "Unable to verify session",
		};
	}

	return (await response.json().catch(() => ({
		isAuthenticated: false,
		user: null,
		error: "Unable to verify session",
	}))) as AuthSessionResponse;
};

export function AuthProvider({
	children,
	initialUser = null,
}: {
	children: React.ReactNode;
	initialUser?: AuthUser | null;
}) {
	const [user, setUser] = useState<AuthUser | null>(initialUser);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | undefined>();

	const refreshSession = useCallback(async () => {
		setIsLoading(true);
		setError(undefined);

		try {
			const session = await readSession();
			setUser(session.isAuthenticated ? session.user : null);
			setError(session.error);
		} catch {
			setUser(null);
			setError("Unable to verify session");
		} finally {
			setIsLoading(false);
		}
	}, []);

	const clearSession = useCallback(() => {
		setUser(null);
		setError(undefined);
	}, []);

	useEffect(() => {
		void refreshSession();
	}, [refreshSession]);

	const value = useMemo<AuthContextValue>(
		() => ({
			user,
			isAuthenticated: Boolean(user),
			isLoading,
			error,
			refreshSession,
			clearSession,
		}),
		[user, isLoading, error, refreshSession, clearSession],
	);

	return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used inside AuthProvider");
	}

	return context;
}
