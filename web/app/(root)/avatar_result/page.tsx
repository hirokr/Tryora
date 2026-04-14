import { AvatarResultCanvas } from "@/components/utility/avatar/result/AvatarResultCanvas";
import { AvatarResultSidebar } from "@/components/utility/avatar/result/AvatarResultSidebar";
import { AvatarResultSummary } from "@/components/utility/avatar/result/AvatarResultSummary";

export default function AvatarResultPage() {
  return (
    <div className="flex min-h-screen overflow-hidden pt-20 font-display text-slate-100" style={{ backgroundColor: "#191022" }}>
      <AvatarResultSidebar />

      <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "#191022" }}>
        <div className="mx-auto max-w-6xl px-6 py-8">
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
              <h2 className="font-serif text-4xl leading-tight text-white md:text-5xl">
                Your 3D Avatar is Ready!
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <AvatarResultCanvas />
            <AvatarResultSummary />
          </div>
        </div>
      </main>
    </div>
  );
}
