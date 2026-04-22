import { SETTINGS_NAV } from "@/constants/experience";

export function SettingsSidebar() {
  return (
    <aside className="w-full md:w-64">
      <div className="mb-4 px-2">
        <h1 className="text-3xl font-black tracking-tight text-white">Settings</h1>
        <p className="mt-1 text-sm text-primary/70">Manage your digital experience</p>
      </div>
      <nav className="space-y-1">
        {SETTINGS_NAV.map((item, index) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
              index === 1
                ? "bg-primary text-white shadow-lg shadow-primary/25"
                : "text-slate-400 hover:bg-primary/10 hover:text-slate-100"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  );
}
