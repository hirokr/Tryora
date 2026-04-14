import { AVATAR_RESULT_SUMMARY } from "@/constants/data";

export function AvatarResultSummary() {
  return (
    <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
      <div className="rounded-xl border border-primary/10 bg-primary/5 p-6">
        <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-400">
          Reconstruction Summary
        </h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">verified</span>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium leading-none text-slate-400">Confidence Score</p>
                <p className="text-xl font-bold text-white">{AVATAR_RESULT_SUMMARY.confidenceScore}</p>
              </div>
            </div>
            <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full w-[98%] bg-primary" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">grain</span>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium leading-none text-slate-400">Landmarks Detected</p>
                <p className="text-xl font-bold text-white">{AVATAR_RESULT_SUMMARY.landmarksDetected}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-green-500">Optimal</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="material-symbols-outlined">speed</span>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium leading-none text-slate-400">Process Time</p>
                <p className="text-xl font-bold text-white">{AVATAR_RESULT_SUMMARY.processTime}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
          <span className="material-symbols-outlined">checkroom</span>
          Start Styling
        </button>
        <button className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 text-base font-bold text-white transition-all hover:bg-primary/20">
          <span className="material-symbols-outlined">straighten</span>
          Edit Measurements
        </button>
        <button className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-transparent text-base font-bold text-slate-400 transition-all hover:bg-white/5">
          <span className="material-symbols-outlined">photo_camera</span>
          Retake Photos
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-slate-800 p-4" style={{ backgroundColor: "rgba(255,255,255,0.02)" }}>
        <span className="material-symbols-outlined flex-shrink-0 text-primary">info</span>
        <p className="text-xs leading-relaxed text-slate-400">
          Tip: Your measurements are private and encrypted. You can adjust the limb length and
          shoulder width manually for more precise tailoring.
        </p>
      </div>
    </div>
  );
}
