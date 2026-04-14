import { DASHBOARD_RECENT_OUTFITS } from "@/constants/data";

export function DashboardOutfits() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-3xl">Recent Outfits</h2>
        <a href="#" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          Full Wardrobe <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </a>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {DASHBOARD_RECENT_OUTFITS.map((outfit) => (
          <div key={outfit.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-primary/10 bg-primary/10">
            <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt={outfit.alt} src={outfit.img} />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background-dark/80 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
              <p className="text-sm font-bold text-white">{outfit.name}</p>
              <p className="text-xs text-slate-300">{outfit.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
