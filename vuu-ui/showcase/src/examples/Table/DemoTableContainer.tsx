import {
  Flexbox,
  LayoutProvider,
  useLayoutOperation,
  View,
} from "@vuu-ui/vuu-layout";
import { ContextPanel } from "@vuu-ui/vuu-shell";
import {
  type LayoutJSON,
  registerComponent,
  VuuShellLocation,
} from "@vuu-ui/vuu-utils";
import { type ReactNode, useCallback } from "react";

import {
  ColumnSettingsPanel,
  TableSettingsPanel,
} from "@vuu-ui/vuu-table-extras";
import {
  ContextPanelProvider,
  type ShowContextPanel,
} from "@vuu-ui/vuu-ui-controls";

if (
  typeof ColumnSettingsPanel !== "function" ||
  typeof TableSettingsPanel !== "function"
) {
  console.warn("unable to load all required components");
} else {
  registerComponent("ColumnSettings", ColumnSettingsPanel, "view");
}

/**
 * Shows context panel content in the layout's ContextPanel. A string
 * component is resolved from the component registry.
 */
const LayoutContextPanelProvider = ({ children }: { children: ReactNode }) => {
  const { showComponentInContextPanel } = useLayoutOperation();
  const showContextPanel = useCallback<ShowContextPanel>(
    (component, title, props) => {
      showComponentInContextPanel(
        typeof component === "string"
          ? ({ type: component, props } as LayoutJSON)
          : component,
        title,
      );
    },
    [showComponentInContextPanel],
  );
  return (
    <ContextPanelProvider showContextPanel={showContextPanel}>
      {children}
    </ContextPanelProvider>
  );
};

export const DemoTableContainer = ({
  children,
  height = "100vh",
}: {
  children: ReactNode;
  height?: string | number;
}) => {
  return (
    <LayoutProvider>
      <Flexbox style={{ height, width: "100vw" }}>
        <View style={{ flex: 1 }}>
          <LayoutContextPanelProvider>{children}</LayoutContextPanelProvider>
        </View>
        <ContextPanel id={VuuShellLocation.ContextPanel} overlay />
      </Flexbox>
    </LayoutProvider>
  );
};
