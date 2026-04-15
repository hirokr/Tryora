export function TryOnSection() {
  return (
    <section id="features" className="bg-background-dark px-6 py-24 lg:px-20 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <h2 className="font-serif text-4xl font-bold leading-tight text-white md:text-5xl">
              AI-Driven <br />
              <span className="italic text-primary">3D Try-On</span>
            </h2>
            <p className="text-xl leading-relaxed text-slate-400">
              Immerse yourself in a high-fidelity virtual fitting room where garments drape perfectly on your digital twin with sub-millimeter accuracy.
            </p>
            <div className="grid gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">straighten</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Precision Mapping</h4>
                  <p className="text-slate-400">Sub-millimeter accuracy for every unique body type.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                  <span className="material-symbols-outlined">waves</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Real-time Physics</h4>
                  <p className="text-slate-400">Fabric simulation powered by advanced AI vertex prediction.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl transition-all group-hover:bg-primary/30"></div>
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-primary/20 bg-accent-dark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="h-full w-full object-cover opacity-80"
                src="/HomePage/home 2.png"
                alt="Digital mannequin being scanned by laser lights"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
