import { createFileRoute } from "@tanstack/react-router";
import { OccupancyDemandHeatmap } from "@/components/occupancy-demand-heatmap";
import { requireAccess } from "@/lib/route-guards";
import { hasCapability } from "@/lib/roles";

export const Route = createFileRoute("/conciergerie/demand")({
  beforeLoad: () => {
    requireAccess((profile) => hasCapability(profile, "financials"));
  },
  component: ConciergerieDemandPage,
});

function ConciergerieDemandPage() {
  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto">
      <OccupancyDemandHeatmap />
    </div>
  );
}
