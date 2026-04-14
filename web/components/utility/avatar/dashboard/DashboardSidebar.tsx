import Link from "next/link";

import { ACCOUNT_NAV, MAIN_NAV } from "@/constants/navigation";

export function DashboardSidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-primary/10 bg-background-dark lg:flex">
      <div className="flex items-center gap-3 p-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
          <span className="material-symbols-outlined">flare</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Tryora</h2>
      </div>

      <nav className="flex-1 space-y-2 px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-4 py-3 text-primary bg-primary/10">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="font-medium">Dashboard</span>
        </Link>

        {MAIN_NAV.map((item) => (
          <Link
            key={item.label}
            href={item.href || "#"}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-500 transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}

        <div className="pb-4 pt-8">
          <p className="px-4 text-xs font-semibold uppercase tracking-widest text-slate-400">Account</p>
        </div>

        {ACCOUNT_NAV.map((item) => (
          <button
            key={item.label}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-slate-500 transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4">
        <div className="glass-card flex items-center gap-3 rounded-xl p-4">
          <div className="h-10 w-10 overflow-hidden rounded-full bg-primary/20">
            <img className="h-full w-full object-cover" alt="User profile" src="/avatar/avatar_customization%203.png" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold">Alex Sterling</p>
            <p className="text-xs font-medium text-primary">Premium Member</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
