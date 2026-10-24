import { createFileRoute } from "@tanstack/react-router";
import { OccupancyDemandHeatmap } from "@/components/occupancy-demand-heatmap";

export const Route = createFileRoute("/owner/demand")({
  component: OwnerDemandPage,
});

function OwnerDemandPage() {
  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-8 lg:px-12 max-w-[1720px] mx-auto">
      <OccupancyDemandHeatmap />
    </div>
  );
}
