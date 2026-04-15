export function AiSceneGenerationSection() {
  return (
    <section className="overflow-hidden bg-background-dark px-6 py-24 lg:px-20 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0" src="/HomePage/home 3.png" alt="Cyberpunk city street environment" />
                </div>
                <div className="aspect-[4/5] translate-x-4 overflow-hidden rounded-2xl border border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0" src="/HomePage/home 5.png" alt="High mountain landscape environment" />
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0" src="/HomePage/home 4.png" alt="Dense forest lighting environment" />
                </div>
                <div className="aspect-[4/5] -translate-x-4 overflow-hidden rounded-2xl border border-primary/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h-full w-full object-cover grayscale transition-all duration-500 hover:grayscale-0" src="/HomePage/home 6.png" alt="Minimalist architectural environment" />
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 flex flex-col gap-8 lg:order-2">
            <h2 className="font-serif text-4xl font-bold leading-tight text-white md:text-5xl">
              AI Scene <br />
              <span className="italic text-primary">Generation</span>
            </h2>
            <p className="text-xl leading-relaxed text-slate-400">
              Transport your avatar to any environment with AI-generated cinematic backgrounds that react to your movements and clothing textures.
            </p>
            <div className="flex flex-col gap-6">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">landscape</span>
                <div>
                  <h4 className="font-bold text-white">Infinite Environments</h4>
                  <p className="text-slate-400">From futuristic neo-Tokyo to serene natural landscapes.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">light_mode</span>
                <div>
                  <h4 className="font-bold text-white">Dynamic Lighting</h4>
                  <p className="text-slate-400">Ray-traced lighting that reacts to your 3D model in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
