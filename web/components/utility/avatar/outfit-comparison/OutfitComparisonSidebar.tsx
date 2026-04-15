import Link from "next/link";

export function OutfitComparisonSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-primary/20 bg-[#191022] lg:flex">
      <div className="flex items-center gap-3 p-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
          <span className="material-symbols-outlined">app_shortcut</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">Tryora</h2>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-4">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition-colors hover:bg-primary/10 hover:text-white">
          <span className="material-symbols-outlined">home</span>
          <span className="text-sm font-medium">Home</span>
        </Link>
        <Link href="/outfit-comparison" className="flex items-center gap-3 rounded-lg bg-primary px-4 py-3 text-white">
          <span className="material-symbols-outlined">compare_arrows</span>
          <span className="text-sm font-medium">Outfit Comparison</span>
        </Link>
        <Link href="/recently-worn" className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-400 transition-colors hover:bg-primary/10 hover:text-white">
          <span className="material-symbols-outlined">history</span>
          <span className="text-sm font-medium">Recently Worn</span>
        </Link>
      </nav>

      <div className="mx-4 mb-6 rounded-lg border border-primary/10 p-4" style={{ backgroundColor: "rgba(140,43,238,0.05)" }}>
        <div className="mb-3 flex items-center gap-3">
          <div className="size-10 overflow-hidden rounded-full bg-slate-700">
            <img className="h-full w-full object-cover" src="/avatar/avatar_customization%202.png" alt="Profile" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Premium User</p>
            <p className="text-[10px] text-slate-400">Sync Mode Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
