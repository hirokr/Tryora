import { BACKEND_URL } from "@/constants/constants";
import { refreshToken } from "./auth";
import { getSession } from "./session";

export interface FetchOptions extends RequestInit {
	headers?: Record<string, string>;
}

export const authFetch = async (
	url: string | URL,
	options: FetchOptions = {},
) => {
	const session = await getSession();

	options.headers = {
		...options.headers,
		Authorization: `Bearer ${session?.accessToken}`,
	};

	let response = await fetch(`${BACKEND_URL}${url}`, options);
	console.log({
		STATUS: response.status,
	});

	if (response.status === 401) {
		if (!session?.refreshToken) {
			return response;
		}

		const newAccessToken = await refreshToken(session.refreshToken);

		if (newAccessToken) {
			options.headers.Authorization = `Bearer ${newAccessToken}`;
			response = await fetch(`${BACKEND_URL}${url}`, options);
		}
	}
	return response;
};
