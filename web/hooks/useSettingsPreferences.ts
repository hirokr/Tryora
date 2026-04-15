"use client";

import { useState } from "react";

import type { EnvMode, QualityMode } from "@/types/experience";

export function useSettingsPreferences() {
  const [envMode, setEnvMode] = useState<EnvMode>("dark");
  const [quality, setQuality] = useState<QualityMode>("ultra");

  return {
    envMode,
    setEnvMode,
    quality,
    setQuality,
  };
}
