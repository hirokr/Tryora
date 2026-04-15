export function WardrobeHeader() {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="font-serif text-4xl text-white">My Wardrobe</h1>
      <div className="flex w-full items-center gap-3 sm:w-auto">
        <div className="relative w-full sm:w-64">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
          <input
            className="w-full rounded-lg border border-primary/20 bg-background-dark py-2 pl-10 pr-4 text-sm text-slate-100 outline-none focus:border-primary"
            placeholder="Search items..."
            type="text"
          />
        </div>
        <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">+ Add New</button>
      </div>
    </header>
  );
}
