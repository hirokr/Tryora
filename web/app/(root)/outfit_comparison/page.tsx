"use client";

import { useActiveTab } from "@/hooks";

import { OutfitComparisonSidebar } from "@/components/utility/avatar/outfit-comparison/OutfitComparisonSidebar";
import { OutfitComparisonSplit } from "@/components/utility/avatar/outfit-comparison/OutfitComparisonSplit";

export default function OutfitComparisonPage() {
  const { activeTab, setActiveTab, isSync } = useActiveTab("sync");
  const syncCamera = isSync;

  return (
    <div className="flex min-h-screen w-full overflow-hidden pt-20 font-display text-slate-100" style={{ backgroundColor: "#191022" }}>
      <OutfitComparisonSidebar />
      <OutfitComparisonSplit
        syncMode={activeTab === "sync"}
        syncCamera={syncCamera}
        toggleSyncMode={() => setActiveTab(activeTab === "sync" ? "free" : "sync")}
        toggleSyncCamera={() => setActiveTab(activeTab === "sync" ? "free" : "sync")}
      />
    </div>
  );
}
