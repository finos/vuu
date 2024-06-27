import { Shell } from "@finos/vuu-shell";
import { CSSProperties } from "react";

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

export const ApplicationSettingsPanel = () => {
  return (
    <Shell
      LeftSidePanelProps={{
        open: false,
        sizeOpen: 200,
        sizeClosed: 60,
      }}
      leftSidePanelLayout="full-height"
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

ApplicationSettingsPanel.displaySequence = displaySequence++;
