import { Shell } from "@finos/vuu-shell";
import { CSSProperties } from "react";

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

export const DefaultShell = () => {
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

DefaultShell.displaySequence = displaySequence++;

export const ShellWithFullHeightLayout = () => {
  return (
    <Shell
      LeftSidePanelProps={{
        children: <div className="My Left Side">My left Side</div>,
        sizeOpen: 200,
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

ShellWithFullHeightLayout.displaySequence = displaySequence++;

export const ShellWithFullHeightLayoutLeftPanelClosed = () => {
  return (
    <Shell
      LeftSidePanelProps={{
        children: <div className="My Left Side">My left Side</div>,
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

ShellWithFullHeightLayoutLeftPanelClosed.displaySequence = displaySequence++;
