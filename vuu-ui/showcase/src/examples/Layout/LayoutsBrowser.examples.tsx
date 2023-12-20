import { LayoutList, LayoutManagementProvider } from "@finos/vuu-shell";

let displaySequence = 0;

export const LayoutsBrowser = (): JSX.Element => {
  return (
    <LayoutManagementProvider>
      <LayoutList />
    </LayoutManagementProvider>
  );
};
LayoutsBrowser.displaySequence = displaySequence++;
