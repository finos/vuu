import { registerComponent } from "@finos/vuu-utils";
import { FluidGrid, FluidGridProps } from "./FluidGrid";

export const FluidGridLayout = function FluidGridLayout(props: FluidGridProps) {
  return <FluidGrid {...props} />;
};
FluidGridLayout.displayName = "FluidGrid";

registerComponent("FluidGrid", FluidGridLayout, "container");
