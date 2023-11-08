import { LayoutsList, LayoutManagementProvider } from "@finos/vuu-shell";

let displaySequence = 0;

export const LayoutsBrowser = (): JSX.Element => {
  return (
    <LayoutManagementProvider>
      <LayoutsList />
    </LayoutManagementProvider>
  );
};
LayoutsBrowser.displaySequence = displaySequence++;
