import { Flexbox, LayoutProvider, View } from "@vuu-ui/vuu-layout";
import { ContextPanel } from "@vuu-ui/vuu-shell";
import { Table } from "@vuu-ui/vuu-table";
import { registerComponent, VuuShellLocation } from "@vuu-ui/vuu-utils";
import { ReactElement } from "react";

import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@vuu-ui/vuu-table-extras";

if (
  typeof ColumnSettingsPanel !== "function" ||
  typeof TableSettingsPanel !== "function"
) {
  console.warn("unable to load all required components");
} else {
  registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
}

export const DemoTableContainer = ({
  children,
  height = "100vh",
}: {
  children: ReactElement<typeof Table>;
  height?: string | number;
}) => {
  return (
    <LayoutProvider>
      <Flexbox style={{ height, width: "100vw" }}>
        <View style={{ flex: 1 }}>{children}</View>
        <ContextPanel id={VuuShellLocation.ContextPanel} />
      </Flexbox>
    </LayoutProvider>
  );
};
