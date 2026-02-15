'use server'

import { UserPrefrence } from "@/types/user";
import { cookies } from "next/headers";

export const getUserPrefrence = async (): Promise<UserPrefrence | null> => {
  const cookie = (await cookies()).get("user_prefrence")?.value;
  if (!cookie) return null;

  try {
    const prefrence = JSON.parse(cookie) as UserPrefrence;
    return prefrence;
  } catch (err) {
    console.error("Failed to parse user prefrence", err);
    return null;
  }
}

export const saveUserPrefrence = async (prefrence: UserPrefrence) => {
  const data = JSON.stringify(prefrence);
  (await cookies()).set("user_prefrence", data, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",  
  })
} 


export const updateUserPrefrence = async (prefrence: UserPrefrence) => {
  const cookie = (await cookies()).get("user_prefrence")?.value;
  if (!cookie) {
    saveUserPrefrence(prefrence);
    return;
  }

  try {
    const existingPrefrence = JSON.parse(cookie) as UserPrefrence;
    const updatedPrefrence = { ...existingPrefrence, ...prefrence };
    saveUserPrefrence(updatedPrefrence);
  } catch (err) {
    console.error("Failed to update user prefrence", err);
    saveUserPrefrence(prefrence); // Fallback to saving new prefrence
  }
} 