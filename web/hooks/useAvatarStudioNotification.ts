"use client";

import { useState } from "react";

import type { NotificationState } from "@/types/common";

export function useAvatarStudioNotification() {
  const [notification, setNotification] = useState<NotificationState>("error");

  return {
    notification,
    showProgress: () => setNotification("progress"),
    showError: () => setNotification("error"),
    clearNotification: () => setNotification("none"),
  };
}
