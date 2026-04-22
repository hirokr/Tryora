"use server";
import { authFetch } from "./authFetch";


export const getProfile = async () => {

	const response = await authFetch(`/api/user/profile`);

	const result = await response.json();
	return result;
};
