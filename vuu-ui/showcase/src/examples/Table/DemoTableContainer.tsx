import { Flexbox, LayoutProvider, View } from "@finos/vuu-layout";
import { ContextPanel } from "@finos/vuu-shell";
import { Table } from "@finos/vuu-table";
import { registerComponent } from "@finos/vuu-utils";
import { ReactElement } from "react";

import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@finos/vuu-table-extras";

if (
  typeof ColumnSettingsPanel !== "function" ||
  typeof TableSettingsPanel !== "function"
) {
  console.warn("unable to load all required components");
} else {
  registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
  registerComponent("TableSettings", TableSettingsPanel, "view");
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
        <ContextPanel />
      </Flexbox>
    </LayoutProvider>
  );
};
