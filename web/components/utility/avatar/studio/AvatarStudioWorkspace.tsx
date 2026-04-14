import { MANUAL_OVERRIDE_MEASUREMENTS } from "@/constants/data";
import type { NotificationState } from "@/types/common";

import { AvatarStudioNotifications } from "./AvatarStudioNotifications";

interface AvatarStudioWorkspaceProps {
  notification: NotificationState;
  onClearNotification: () => void;
  onRetry: () => void;
}

export function AvatarStudioWorkspace({
  notification,
  onClearNotification,
  onRetry,
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
          />
          <p className="text-sm font-medium text-slate-400">3D Environment Initializing...</p>
        </div>
      </div>

     

      <div className="absolute left-8 top-8 z-10 w-72 rounded-lg border border-primary/10 bg-[#20132b]/40 p-5 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2 text-amber-400">
          <span className="material-symbols-outlined text-sm">warning</span>
          <span className="text-xs font-bold uppercase tracking-widest">Low Confidence Detected</span>
        </div>
        <h3 className="mb-4 text-sm font-bold text-slate-200">Manual Measurement Override</h3>
        <div className="space-y-4">
          {MANUAL_OVERRIDE_MEASUREMENTS.map(({ label, value }) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-[10px] font-bold uppercase text-slate-400">
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <input className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-primary" type="range" />
            </div>
          ))}
        </div>
        <button className="mt-6 w-full rounded-md border border-primary/50 bg-primary/20 py-2 text-xs font-bold text-primary transition-all hover:bg-primary hover:text-white">
          Update Avatar Mesh
        </button>
      </div>

      <AvatarStudioNotifications
        notification={notification}
        onClear={onClearNotification}
        onRetry={onRetry}
      />
    </div>
  );
}
