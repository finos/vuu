import { Shell } from "@finos/vuu-shell";
import { CSSProperties } from "react";

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
