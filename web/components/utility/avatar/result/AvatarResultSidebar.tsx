import Link from "next/link";

import { AVATAR_RESULT_NAV_LINKS } from "@/constants/data";

export function AvatarResultSidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-primary/10 md:flex" style={{ backgroundColor: "#191022" }}>
      <div className="p-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
            <span className="material-symbols-outlined">view_in_ar</span>
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none text-white">Tryora</h1>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">3D Avatar Gen</p>
          </div>
        </div>

        <nav className="space-y-1">
          {AVATAR_RESULT_NAV_LINKS.map((item) => {
            const classes = item.active
              ? "bg-primary/20 text-primary"
              : "text-slate-400 hover:bg-primary/10 hover:text-primary";

            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${classes}`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${classes}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6">
        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <p className="mb-2 text-xs text-slate-400">Current Project</p>
          <p className="text-sm font-semibold text-white">Summer Collection &apos;24</p>
        </div>
      </div>
    </aside>
  );
}
