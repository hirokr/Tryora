export function AvatarResultHeading() {
  return (
    <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded-full border border-primary/30 bg-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
            High Fidelity
          </span>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            Powered by Gemini AI
          </div>
        </div>
        <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">Your 3D Avatar is Ready!</h2>
      </div>
    </div>
  );
}
