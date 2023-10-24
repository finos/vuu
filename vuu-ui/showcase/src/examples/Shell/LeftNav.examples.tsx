import { LeftNav } from "@finos/vuu-shell";

let displaySequence = 0;

export const VerticalTabstrip = () => {
  return <LeftNav features={[]} tableFeatures={[]} />;
};
VerticalTabstrip.displaySequence = displaySequence++;
