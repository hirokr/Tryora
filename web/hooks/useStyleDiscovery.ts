"use client";

import { useState } from "react";

export function useStyleDiscovery() {
  const [selectedAesthetic, setSelectedAesthetic] = useState<string | null>(null);

  return {
    selectedAesthetic,
    setSelectedAesthetic,
  };
}
