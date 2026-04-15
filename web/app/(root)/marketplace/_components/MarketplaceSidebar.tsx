import type { NavItem } from "../../../../types/producttypes";

type MarketplaceSidebarProps = {
  navItems: NavItem[];
};

export function MarketplaceSidebar({ navItems }: MarketplaceSidebarProps) {
  return (
    <aside className="w-64 border-r border-primary/10 bg-background-light dark:bg-background-dark flex-col hidden md:flex">
      <div className="p-6 flex items-center gap-3">
        <div className="size-10 bg-primary rounded-full flex items-center justify-center text-white">
          <span className="material-symbols-outlined">shopping_bag</span>
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
            Tryora
          </h1>
          <p className="text-xs text-primary font-medium mt-1">Marketplace</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <a
            key={item.label}
            href="#"
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              item.active
                ? "bg-primary text-white"
                : "text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="font-medium">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-primary/10">
        <a
          href="#"
          className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
          <span className="font-medium">Settings</span>
        </a>
        <div className="mt-4 flex items-center gap-3 px-4 py-3">
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            <img
              alt="User"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBatnVtFn6d5udBXzG8Bu7gbl1P5aFndWzpUOEfPt9SfEedDIL6M3Gu9fMc68z7qV7QIQiIloj2qLQkjIDzngzjGJk2DjnFnSQgW_uMLtN42MODOUC7wozeP9vkIWxMC-eltPeWOdjHjpNltjcULipPirwaon8XJZD_u3LjSts-oQsrZxsKGUL6OlWM90YwwkSiMe2vR9Xma5a_-Ed_gq5u__W24UkZ1rBubpQs879cfP_A9DX6AlCBFmQ6IzF9DHxVcHsummQwzb-e"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Alex Rivera</p>
            <p className="text-xs text-slate-500">Pro Account</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
