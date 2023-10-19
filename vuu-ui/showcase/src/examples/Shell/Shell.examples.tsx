import { Shell } from "@finos/vuu-shell";
import { AppSidePanel } from "app-vuu-example/src/app-sidepanel";
import { CSSProperties, useMemo } from "react";
import { useMockFeatureData } from "../utils/mock-data";
import { useAutoLoginToVuuServer } from "../utils";

import { AutoVuuTable } from "../html/HtmlTable.examples";
import { registerComponent } from "@finos/vuu-layout";

registerComponent("AutoVuuTable", AutoVuuTable, "view");

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

export const EmptyShell = () => {
  return (
    <Shell
      loginUrl={window.location.toString()}
      user={user}
      style={
        {
          "--vuuShell-height": "100%",
          "--vuuShell-width": "100%",
        } as CSSProperties
      }
    />
  );
};

EmptyShell.displaySequence = displaySequence++;

export const ShellWithDefaultLayout = () => {
  return (
    <Shell
      loginUrl={window.location.toString()}
      user={user}
      style={
        {
          "--vuuShell-height": "100%",
          "--vuuShell-width": "100%",
        } as CSSProperties
      }
    />
  );
};

ShellWithDefaultLayout.displaySequence = displaySequence++;

export const ShellWithLeftPanel = () => {
  const { features, schemas } = useMockFeatureData();
  return (
    <Shell
      leftSidePanel={<AppSidePanel features={features} tables={schemas} />}
      loginUrl={window.location.toString()}
      user={user}
      style={
        {
          "--vuuShell-height": "100%",
          "--vuuShell-width": "100%",
        } as CSSProperties
      }
    />
  );
};

ShellWithLeftPanel.displaySequence = displaySequence++;

export const ShellWithDefaultLayoutAndLeftPanel = () => {
  const error = useAutoLoginToVuuServer();

  const { features, schemas } = useMockFeatureData();

  if (error) {
    return error;
  }

  return (
    <Shell
      leftSidePanel={<AppSidePanel features={features} tables={schemas} />}
      loginUrl={window.location.toString()}
      user={user}
      style={
        {
          "--vuuShell-height": "100%",
          "--vuuShell-width": "100%",
        } as CSSProperties
      }
    />
  );
};

ShellWithDefaultLayoutAndLeftPanel.displaySequence = displaySequence++;
