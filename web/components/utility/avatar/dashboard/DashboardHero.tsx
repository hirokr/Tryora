export function DashboardHero() {
  return (
    <section className="grid h-[360px] grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="relative overflow-hidden rounded-xl border border-primary/20 lg:col-span-8" style={{ background: "linear-gradient(135deg, rgba(140,43,238,0.3) 0%, #191022 50%, #191022 100%)" }}>
        <div className="relative z-10 flex h-full max-w-lg flex-col justify-center p-10">
          <h2 className="mb-4 font-serif text-4xl italic">Welcome back, Alex.</h2>
          <p className="mb-8 text-lg text-slate-400">
            Your 3D avatar is synced with the latest collection. Start a new VTON session.
          </p>
          <div className="flex gap-4">
            <button className="flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-background-dark hover:bg-slate-200">
              <span className="material-symbols-outlined">view_in_ar</span>
              Preview Avatar
            </button>
            <button className="rounded-xl border border-white/20 px-6 py-3 font-bold hover:bg-white/10">
              Customize Rig
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 top-0 hidden w-1/2 items-end justify-center lg:flex">
          <img className="h-[120%] object-cover brightness-75 grayscale transition-all duration-700 group-hover:grayscale-0" alt="Futuristic 3D avatar preview" src="/avatar/avatar_studio%201.png" />
        </div>
      </div>
    </section>
  );
}
