import { AvatarResultCanvas } from "@/components/utility/avatar/result/AvatarResultCanvas";
import { AvatarResultSidebar } from "@/components/utility/avatar/result/AvatarResultSidebar";
import { AvatarResultSummary } from "@/components/utility/avatar/result/AvatarResultSummary";

import { AvatarResultHeading } from "./_components/AvatarResultHeading";

export default function AvatarResultPage() {
  return (
    <div className="flex min-h-screen overflow-hidden pt-20 font-display text-slate-100" style={{ backgroundColor: "#191022" }}>
      <AvatarResultSidebar />

      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#191022" }}>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <AvatarResultHeading />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <AvatarResultCanvas />
            <AvatarResultSummary />
          </div>
        </div>
      </main>
    </div>
  );
}
