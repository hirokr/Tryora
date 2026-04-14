"use client";

import { RecentlyWornPanels } from "@/components/utility/avatar/recently-worn/RecentlyWornPanels";

export default function RecentlyWornPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pt-20 font-display text-slate-100" style={{ backgroundColor: "#191022" }}>
      <RecentlyWornPanels />
    </div>
  );
}
