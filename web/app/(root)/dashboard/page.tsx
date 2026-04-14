import { DashboardHero } from "@/components/utility/avatar/dashboard/DashboardHero";
import { DashboardOutfits } from "@/components/utility/avatar/dashboard/DashboardOutfits";
import { DashboardSidebar } from "@/components/utility/avatar/dashboard/DashboardSidebar";
import { DashboardStatusCard } from "@/components/utility/avatar/dashboard/DashboardStatusCard";
import { DashboardStyleStats } from "@/components/utility/avatar/dashboard/DashboardStyleStats";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen overflow-hidden bg-background-dark pt-20 text-slate-100">
      <DashboardSidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="space-y-8 p-8">
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <DashboardHero />
            </div>
            <div className="lg:col-span-4">
              <DashboardStatusCard />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DashboardOutfits />
            </div>
            <div>
              <DashboardStyleStats />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
