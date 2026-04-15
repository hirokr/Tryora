import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <div className="hero-gradient absolute inset-0 z-10 bg-background-dark/40"></div>
        <div className="flex h-full w-full items-center justify-center bg-slate-900">
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #3a1a5e 0%, #0a070d 70%)", opacity: 0.5 }}></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            src="/HomePage/home 1.png"
            alt="Futuristic digital character with neon accents"
          />
        </div>
      </div>

      <div className="relative z-20 flex flex-col items-center gap-8 px-6 text-center">
        <h1 className="font-serif text-5xl font-bold leading-tight text-white md:text-7xl lg:max-w-4xl">
          Experience the <span className="text-primary">Future</span> of Fashion
        </h1>
        <p className="max-w-2xl text-lg text-slate-300 md:text-xl">
          AI-driven 3D reconstruction and cinematic try-on experiences. Your digital identity, perfectly draped.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/auth/signup" className="flex h-14 min-w-[200px] items-center justify-center rounded-xl bg-primary px-8 text-lg font-bold text-white transition-all hover:scale-105">
            Launch Studio
          </Link>
          <a href="#features" className="flex h-14 min-w-[200px] items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 text-lg font-bold text-white backdrop-blur-md transition-all hover:bg-white/10">
            View Showcase
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 animate-bounce flex-col items-center -space-y-0.5 opacity-60">
        <span className="h-3 w-3 rotate-45 border-b-2 border-r-2 border-white" aria-hidden="true"></span>
        <span className="h-3 w-3 rotate-45 border-b-2 border-r-2 border-white" aria-hidden="true"></span>
      </div>
    </section>
  );
}
