import Link from "next/link";

import { AVATAR_STUDIO_NAV_LINKS } from "@/constants/data";

export function AvatarStudioSidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-primary/20 lg:flex" style={{ backgroundColor: "#191022" }}>
      <div className="flex flex-col gap-1 p-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-primary">
          <span className="material-symbols-outlined">view_in_ar</span>
          Tryora
        </h1>
        <div className="flex items-center gap-2 px-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">PWA Status: Online</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-2 px-4">
        {AVATAR_STUDIO_NAV_LINKS.map((item) => {
          const classes = item.active
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : "text-slate-400 hover:bg-primary/10 hover:text-primary";

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${classes}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${classes}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}

        <Link
          href="/avatar_result"
          className="mt-2 inline-flex rounded-lg bg-primary/20 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/30"
        >
          View Result
        </Link>
      </nav>

      <div className="mt-auto p-6">
        <div className="flex items-center gap-3 rounded-lg border border-primary/10 bg-primary/5 p-3">
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
          <p className="text-xs font-semibold uppercase tracking-tighter text-primary">Powered by Gemini</p>
        </div>
      </div>
    </aside>
  );
}
