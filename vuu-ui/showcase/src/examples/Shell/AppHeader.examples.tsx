import { AppHeader } from "@finos/vuu-shell";

let displaySequence = 1;

export const DefaultAppHeader = () => {
  return <AppHeader />;
};
DefaultAppHeader.displaySequence = displaySequence++;
