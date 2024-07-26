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
    ></Shell>
  );
};

DefaultShell.displaySequence = displaySequence++;

export const SimpleShellCustomHeader = () => {
  const headerStyle: CSSProperties = {
    alignItems: "center",
    background: "yellow",
    display: "flex",
    height: 50,
    padding: "0 18px",
  };
  return (
    <Shell
      ShellLayoutProps={{
        appHeader: <div style={headerStyle}>Custom Header</div>,
      }}
      loginUrl={window.location.toString()}
      user={user}
      style={
        {
          "--vuuShell-height": "100%",
          "--vuuShell-width": "100%",
        } as CSSProperties
      }
    ></Shell>
  );
};

SimpleShellCustomHeader.displaySequence = displaySequence++;

export const SimpleShellNoWorkspaceTabs = () => {
  return (
    <Shell
      ContentLayoutProps={{
        WorkspaceProps: {
          showTabs: false,
        },
      }}
      loginUrl={window.location.toString()}
      user={user}
      style={
        {
          "--vuuShell-height": "100%",
          "--vuuShell-width": "100%",
        } as CSSProperties
      }
    ></Shell>
  );
};

SimpleShellNoWorkspaceTabs.displaySequence = displaySequence++;

export const FullHeightLeftPanel = () => {
  return (
    <Shell
      ShellLayoutProps={{
        LeftSidePanelProps: {
          children: <div className="My Left Side">My left Side</div>,
          sizeOpen: 200,
        },
        layoutTemplateId: "full-height",
      }}
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
FullHeightLeftPanel.displaySequence = displaySequence++;

export const FullHeightLeftPanelLeftPanelClosed = () => {
  return (
    <Shell
      ShellLayoutProps={{
        LeftSidePanelProps: {
          children: <div className="My Left Side">My left Side</div>,
          open: false,
          sizeOpen: 200,
          sizeClosed: 60,
        },
        layoutTemplateId: "full-height",
      }}
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

FullHeightLeftPanelLeftPanelClosed.displaySequence = displaySequence++;

export const InlayLeftPanel = () => {
  return (
    <Shell
      ShellLayoutProps={{
        LeftSidePanelProps: {
          children: <div className="My Left Side">My left Side</div>,
          sizeOpen: 200,
        },
        layoutTemplateId: "inlay",
      }}
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
InlayLeftPanel.displaySequence = displaySequence++;
