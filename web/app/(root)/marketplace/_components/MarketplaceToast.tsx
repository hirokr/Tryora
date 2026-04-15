type MarketplaceToastProps = {
  onClose: () => void;
};

export function MarketplaceToast({ onClose }: MarketplaceToastProps) {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="bg-slate-900 dark:bg-primary text-white p-4 rounded-xl shadow-2xl flex items-center gap-4">
        <div className="size-10 bg-white/20 rounded-lg flex items-center justify-center">
          <span className="material-symbols-outlined">check_circle</span>
        </div>
        <div>
          <h4 className="text-sm font-bold">Avatar Sync Complete</h4>
          <p className="text-xs text-white/80">AI Job Finished successfully</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          View
        </button>
      </div>
    </div>
  );
}
