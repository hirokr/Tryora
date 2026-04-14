import { PUBLIC_VIEW_OUTFIT_ITEMS } from "@/constants/data";

export function PublicViewPanels() {
  const glass = {
    background: "rgba(25,16,34,0.6)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(140,43,238,0.2)",
  } as React.CSSProperties;

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="relative h-full min-h-[420px] w-full overflow-hidden rounded-3xl border border-primary/10">
          <img className="h-full w-full object-cover" src="/avatar/avatar_result1.png" alt="Public avatar render" />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-primary/40 bg-primary/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            Public View
          </div>
        </div>
      </div>

      <aside className="w-full border-primary/20 p-8 lg:w-[420px] lg:border-l" style={glass}>
        <h1 className="mb-3 font-serif text-4xl italic">Cyber-Glow Ensemble</h1>
        <p className="mb-6 text-primary/60">A high-fidelity 3D look generated for the metaverse.</p>

        <div className="space-y-3">
          {PUBLIC_VIEW_OUTFIT_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-3">
              <div className="size-14 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('${item.img}')` }} />
              <div className="flex-1">
                <p className="font-bold text-white">{item.name}</p>
                <p className="text-sm text-primary">{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
