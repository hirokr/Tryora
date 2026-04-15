import { DashboardHero } from "@/components/utility/avatar/dashboard/DashboardHero";
import { DashboardOutfits } from "@/components/utility/avatar/dashboard/DashboardOutfits";
import { DashboardStatusCard } from "@/components/utility/avatar/dashboard/DashboardStatusCard";
import { DashboardStyleStats } from "@/components/utility/avatar/dashboard/DashboardStyleStats";

export default function DashboardPage() {
  return (
      <main className="min-h-screen overflow-y-auto bg-background-dark pt-20 text-slate-100">
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
  );
}
