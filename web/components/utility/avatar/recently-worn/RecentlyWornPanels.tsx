import { RECENTLY_WORN_TIMELINE } from "@/constants/data";

export function RecentlyWornPanels() {
  const glassDark = {
    background: "rgba(25,16,34,0.6)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(140,43,238,0.2)",
  } as React.CSSProperties;

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 lg:flex-row lg:p-6">
      <section className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-4xl leading-tight md:text-5xl">Recently Worn</h1>
          <p className="text-lg text-primary/60">Your digital twin&apos;s style evolution</p>
        </div>

        <div className="relative min-h-[500px] flex-1 overflow-hidden rounded-xl border border-primary/30">
          <img className="absolute inset-0 h-full w-full object-cover" alt="3D digital twin avatar" src="/avatar/avatar_studio%202.png" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 to-transparent p-8 flex items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Active Look</span>
              <h3 className="font-serif text-2xl text-white">Cyber-Chic Gala Set</h3>
            </div>
          </div>
        </div>
      </section>

      <aside className="flex w-full flex-col gap-4 lg:w-[450px]">
        <h2 className="font-serif text-xl">Style Timeline</h2>
        <div className="custom-scrollbar max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto pr-2">
          {RECENTLY_WORN_TIMELINE.map((item) => (
            <div
              key={item.id}
              className={`group flex gap-4 rounded-xl p-4 transition-all ${item.faded ? "opacity-60 grayscale hover:opacity-100 hover:grayscale-0" : ""}`}
              style={glassDark}
            >
              <div className="relative size-28 shrink-0 overflow-hidden rounded-lg border border-white/5">
                <img className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" alt={item.alt} src={item.img} />
              </div>
              <div className="flex flex-1 flex-col justify-between py-1">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-primary">{item.date}</p>
                  <h4 className="font-serif text-lg leading-tight">{item.name}</h4>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <button className="mt-3 rounded-lg bg-primary py-2 text-sm font-bold text-white hover:bg-primary/80">
                  {item.worn ? "Previously Worn" : "Re-Wear"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}
