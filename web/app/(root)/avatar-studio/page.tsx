"use client";

import { AvatarStudioRightPanel } from "@/components/utility/avatar/studio/AvatarStudioRightPanel";
import { AvatarStudioWorkspace } from "@/components/utility/avatar/studio/AvatarStudioWorkspace";
import { useAvatarStudioNotification } from "@/hooks/useAvatarStudioNotification";

export default function AvatarStudioPage() {
  const { notification, clearNotification, showProgress } = useAvatarStudioNotification();

  return (
    <div className="flex min-h-screen w-full overflow-hidden pt-20 font-display text-slate-100" style={{ backgroundColor: "#191022" }}>
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <AvatarStudioWorkspace
            notification={notification}
            onClearNotification={clearNotification}
            onRetry={showProgress}
          />
          <AvatarStudioRightPanel />
        </div>
      </main>
    </div>
  );
}
