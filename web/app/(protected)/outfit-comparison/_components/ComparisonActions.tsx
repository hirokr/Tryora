type ComparisonActionsProps = {
  canSnapshot: boolean;
  onUploadPhoto: () => void;
  onSnapshot: () => void;
};

export function ComparisonActions({
  canSnapshot,
  onUploadPhoto,
  onSnapshot,
}: ComparisonActionsProps) {
  return (
    <div className="mx-6 my-4 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-primary/20 p-3">
      <button
        type="button"
        onClick={onUploadPhoto}
        className="rounded-lg bg-primary px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
      >
        Upload Photo
      </button>
      <button
        type="button"
        onClick={onSnapshot}
        disabled={!canSnapshot}
        className="rounded-lg border border-white/20 px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-slate-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Snapshot
      </button>
    </div>
  );
}
