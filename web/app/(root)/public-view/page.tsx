import { PublicViewPanels } from "@/components/utility/avatar/public-view/PublicViewPanels";

export default function PublicViewPage() {
  return (
    <div
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden pt-20 font-display text-slate-100"
      style={{
        backgroundColor: "#191022",
        backgroundImage:
          "radial-gradient(at 0% 0%, rgba(140,43,238,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(140,43,238,0.1) 0px, transparent 50%)",
      }}
    >
      <PublicViewPanels />
    </div>
  );
}  // End of file
