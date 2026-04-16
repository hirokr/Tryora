import type { NotificationState } from "@/types/common";

import { AvatarStudioNotifications } from "./AvatarStudioNotifications";

interface AvatarStudioWorkspaceProps {
  notification: NotificationState;
  onClearNotification: () => void;
  onRetry: () => void;
  onAvatarLoadError: () => void;
  onAvatarLoadSuccess: () => void;
}

export function AvatarStudioWorkspace({
  notification,
  onClearNotification,
  onRetry,
  onAvatarLoadError,
  onAvatarLoadSuccess,
}: AvatarStudioWorkspaceProps) {
  return (
    <div className="relative flex flex-1 items-center justify-center" style={{ backgroundColor: "#120a1a" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ background: "radial-gradient(circle at center, #8c2bee, transparent, transparent)" }}
      />

      <div className="z-0 flex h-full w-full items-center justify-center">
        <div className="relative flex flex-col items-center gap-4 text-center">
          <div className="absolute h-96 w-64 rounded-full bg-gradient-to-b from-primary/10 to-transparent opacity-30 blur-3xl" />
          <img
            src="/avatar/avatar_studio%202.png"
            alt="Avatar preview"
            className="relative h-[70%] max-h-[520px] object-contain"
            onLoad={onAvatarLoadSuccess}
            onError={onAvatarLoadError}
          />
          <p className="text-sm font-medium text-slate-400">3D Environment Initializing...</p>
        </div>
      </div>

      <AvatarStudioNotifications
        notification={notification}
        onClear={onClearNotification}
        onRetry={onRetry}
      />
    </div>
  );
}
