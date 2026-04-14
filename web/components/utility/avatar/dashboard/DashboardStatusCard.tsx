import { DASHBOARD_JOB_QUEUE } from "@/constants/data";

export function DashboardStatusCard() {
  return (
    <div className="glass-card flex flex-col rounded-xl border border-primary/20 p-6">
      <h3 className="mb-6 font-serif text-2xl">AI Job Status</h3>
      <div className="flex-1 space-y-6">
        {DASHBOARD_JOB_QUEUE.map((job) => (
          <div key={job.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-300">
                <span className={`h-2 w-2 rounded-full ${job.queued ? "bg-slate-600" : "bg-primary animate-pulse"}`} />
                {job.label}
              </span>
              <span className="font-bold text-primary">{job.queued ? "Queued" : `${job.progress}%`}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-primary/10">
              <div className={`h-full rounded-full bg-primary ${job.queued ? "w-0" : ""}`} style={{ width: `${job.progress || 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <button className="mt-6 w-full rounded-xl border border-primary/30 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/10">
        View All Queue
      </button>
    </div>
  );
}
