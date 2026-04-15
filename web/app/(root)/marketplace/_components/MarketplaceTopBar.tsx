export function MarketplaceTopBar() {
  return (
    <header className="h-20 border-b border-primary/10 bg-background-light dark:bg-background-dark flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 gap-4">
      <div className="flex-1 max-w-2xl">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
            search
          </span>
          <input
            className="w-full pl-12 pr-4 py-2.5 bg-slate-100 dark:bg-primary/10 border-none rounded-xl focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white transition-all outline-none"
            placeholder="Search for unique products, styles, or brands..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-primary/10 rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="p-2 text-slate-600 dark:text-slate-300 hover:bg-primary/10 rounded-full transition-colors">
          <span className="material-symbols-outlined">shopping_cart</span>
        </button>
        <div className="h-8 w-px bg-primary/20 mx-1 hidden md:block"></div>
        <button className="bg-primary hover:bg-primary/90 text-white px-3 md:px-5 py-2 rounded-lg font-medium transition-all shadow-lg shadow-primary/20 text-xs md:text-sm whitespace-nowrap">
          Connect Wallet
        </button>
      </div>
    </header>
  );
}
