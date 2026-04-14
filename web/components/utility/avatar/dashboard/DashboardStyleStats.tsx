import { STYLE_CATEGORIES } from "@/constants/data";

export function DashboardStyleStats() {
  return (
    <div className="space-y-6">
      <h2 className="font-serif text-3xl">Style Stats</h2>
      <div className="glass-card space-y-6 rounded-xl border border-primary/20 p-6">
        <div>
          <p className="mb-4 text-sm text-slate-400">Most Worn Categories</p>
          <div className="space-y-4">
            {STYLE_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{cat.label}</span>
                  <span className="font-bold text-primary">{cat.pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="border-primary/10" />

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-tighter text-slate-400">Total Renders</p>
            <p className="mt-1 text-2xl font-bold">1,284</p>
          </div>
          <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
            <p className="text-xs uppercase tracking-tighter text-slate-400">Wardrobe Items</p>
            <p className="mt-1 text-2xl font-bold">42</p>
          </div>
        </div>
      </div>
    </div>
  );
}
