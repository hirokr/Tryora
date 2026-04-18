"use client";

import { useState } from "react";

import type { NotificationState } from "@/types/common";

export function useAvatarStudioNotification() {
	const [notification, setNotification] = useState<NotificationState>("none");

	return {
		notification,
		showProgress: () => setNotification("progress"),
		showError: () => setNotification("error"),
		showSuccess: () => setNotification("success"),
		clearNotification: () => setNotification("none"),
	};
}
