"use server";

import { BACKEND_URL } from "@/constants/constants";
import { authFetch } from "./authFetch";


export const getProfile = async () => {

	const response = await authFetch(`${BACKEND_URL}/api/user/profile`);

	const result = await response.json();
	return result;
};
