export function AvatarStudioRightPanel() {
  return (
    <aside className="hidden w-80 flex-col border-l border-primary/20 xl:flex" style={{ backgroundColor: "#191022" }}>
      <div className="p-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-widest text-slate-400">Body Scans</h3>

        <div className="group mb-6 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-primary/30 p-8 transition-colors hover:border-primary">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
            <span className="material-symbols-outlined text-3xl">add_a_photo</span>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white">New Scan</p>
            <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">Upload photos or video</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-tight text-slate-400">Recent Sessions</p>

          <div className="group cursor-pointer rounded-lg border border-[#2d2237] bg-[#21142c]/70 p-3 transition-colors hover:border-primary/50">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded bg-slate-800">
                <img
                  className="h-full w-full object-cover opacity-50 transition-opacity group-hover:opacity-100"
                  src="/avatar/avatar_result1.png"
                  alt="Main avatar scan"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-200">Main Avatar</p>
                <p className="text-[10px] font-medium text-slate-500">Created 2 days ago</p>
              </div>
              <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
            </div>
          </div>

          <div className="rounded-lg border border-[#2d2237] bg-[#21142c]/70 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-800">
                <span className="material-symbols-outlined animate-spin text-slate-500">sync</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-200">Session #821</p>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-700">
                  <div className="h-full w-[65%] bg-primary" />
                </div>
                <p className="mt-1 text-[10px] font-bold uppercase text-primary">AI Processing 65%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-primary/10 bg-[#21142c]/60 p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-slate-500">Cloud Storage</span>
          <span className="text-[10px] font-bold text-slate-500">2.4 / 5 GB</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div className="h-full w-[48%] bg-primary" />
        </div>
        <button className="mt-4 flex w-full items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 transition-colors hover:text-primary">
          <span className="material-symbols-outlined text-sm">settings</span>
          Studio Settings
        </button>
      </div>
    </aside>
  );
}
