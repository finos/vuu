import { Flexbox, LayoutProvider, View } from "@finos/vuu-layout";
import { ContextPanel } from "@finos/vuu-shell";
import { Table } from "@finos/vuu-table";
import { ReactElement } from "react";
import { registerComponent } from "@finos/vuu-layout";

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
}: {
  children: ReactElement<typeof Table>;
}) => {
  return (
    <LayoutProvider>
      <Flexbox style={{ height: "100vh", width: "100vw" }}>
        <View style={{ flex: 1 }}>{children}</View>
        <ContextPanel id="context-panel" />
      </Flexbox>
    </LayoutProvider>
  );
};
