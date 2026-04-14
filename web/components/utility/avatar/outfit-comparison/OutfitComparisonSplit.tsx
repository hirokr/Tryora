interface OutfitComparisonSplitProps {
  syncMode: boolean;
  syncCamera: boolean;
  toggleSyncMode: () => void;
  toggleSyncCamera: () => void;
}

export function OutfitComparisonSplit({
  syncMode,
  syncCamera,
  toggleSyncMode,
  toggleSyncCamera,
}: OutfitComparisonSplitProps) {
  const glass = {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(20px)",
    border: "0.5px solid rgba(255,255,255,0.1)",
  } as React.CSSProperties;

  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-white">Outfit Comparison</h1>
          <button
            onClick={toggleSyncMode}
            className="rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary"
          >
            {syncMode ? "Sync Mode" : "Free Look"}
          </button>
        </div>
        <label className="flex items-center gap-3 text-xs text-slate-400">
          Sync Camera
          <input type="checkbox" checked={syncCamera} onChange={toggleSyncCamera} />
        </label>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="group relative flex-1 border-r border-primary/30">
          <img className="mx-auto max-h-[85%] object-contain" src="/avatar/avatar_studio%201.png" alt="Outfit A Avatar" />
          <div className="absolute left-6 top-6 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white" style={glass}>Outfit A</div>
        </div>

        <div className="group relative flex-1">
          <img className="mx-auto max-h-[85%] object-contain" style={{ transform: "scaleX(-1)" }} src="/avatar/avatar_studio%202.png" alt="Outfit B Avatar" />
          <div className="absolute right-6 top-6 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white" style={glass}>Outfit B</div>
        </div>
      </div>

      <div className="mx-6 my-4 flex items-center justify-center gap-4 rounded-xl border border-primary/20 p-3">
        <button className="rounded-lg bg-primary px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white">Checkout Both</button>
        <button className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Snapshot</button>
      </div>
    </main>
  );
}
