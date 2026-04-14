import { MOTION_MODES } from "@/constants/data";

interface AvatarCustomizationViewportProps {
  activeMotion: number;
  setActiveMotion: (index: number) => void;
}

export function AvatarCustomizationViewport({
  activeMotion,
  setActiveMotion,
}: AvatarCustomizationViewportProps) {
  return (
    <div className="relative flex flex-1 items-center justify-center bg-gradient-to-b from-[#1a1122] to-[#0d0812]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-[120px]" />
      </div>

      <div className="relative flex h-full w-full cursor-grab items-center justify-center active:cursor-grabbing">
        <img
          alt="Full body 3D human avatar model"
          src="/avatar/avatar_studio%201.png"
          className="h-[80%] object-contain drop-shadow-[0_0_50px_rgba(140,43,238,0.28)]"
        />

        <div
          className="absolute left-1/2 top-1/4 flex -translate-x-32 items-center gap-2 rounded-full px-2 py-1 opacity-70"
          style={{
            background: "rgba(43,28,58,0.4)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(140,43,238,0.2)",
          }}
        >
          <div className="size-2 animate-pulse rounded-full bg-primary" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">
            Shoulder Pivot
          </span>
        </div>
      </div>

      <div className="absolute bottom-32 left-8 flex flex-col gap-3">
        {["zoom_in", "refresh", "grid_view"].map((icon) => (
          <button
            key={icon}
            className="rounded-xl p-3 text-white/70 transition-all hover:bg-primary/20 hover:text-white"
            style={{
              background: "rgba(43,28,58,0.4)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(140,43,238,0.2)",
            }}
          >
            <span className="material-symbols-outlined">{icon}</span>
          </button>
        ))}
      </div>

      <div
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-8 rounded-2xl px-6 py-4"
        style={{
          background: "rgba(43,28,58,0.4)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(140,43,238,0.2)",
          boxShadow: "0 0 20px rgba(140,43,238,0.15)",
        }}
      >
        <span className="border-r border-white/10 pr-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Motion Testing
        </span>
        <div className="flex gap-4">
          {MOTION_MODES.map((mode, i) => (
            <button
              key={mode.label}
              onClick={() => setActiveMotion(i)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeMotion === i ? "bg-primary text-white" : "text-slate-300 hover:bg-white/5"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "0.875rem" }}>
                {mode.icon}
              </span>
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
