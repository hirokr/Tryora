"use client";

import { useState } from "react";

import type { TabType } from "@/types/common";

export function useActiveTab(defaultTab: TabType = "sync") {
	const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

	return {
		activeTab,
		setActiveTab,
		isSync: activeTab === "sync",
	};
}
