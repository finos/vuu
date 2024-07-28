import { Placeholder } from "@finos/vuu-layout";
import {
  PersistenceProvider,
  Shell,
  StaticPersistenceManager,
  WorkspaceProps,
} from "@finos/vuu-shell";
import { registerComponent } from "@finos/vuu-utils";
import { CSSProperties, HTMLAttributes, useMemo } from "react";

registerComponent("Placeholder", Placeholder, "component");

const user = { username: "test-user", token: "test-token" };

let displaySequence = 1;

const htmlAttributes = {
  "data-testid": "shell",
} as HTMLAttributes<HTMLDivElement>;

export const DefaultShell = () => {
  return (
    <Shell
      shellLayoutProps={{
        htmlAttributes: htmlAttributes,
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
      shellLayoutProps={{
        appHeader: (
          <header style={headerStyle} title="Custom Header">
            Custom Header
          </header>
        ),
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
      workspaceProps={{
        showTabs: false,
      }}
      shellLayoutProps={{
        htmlAttributes: htmlAttributes,
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
      shellLayoutProps={{
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
      shellLayoutProps={{
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
  const persistNothing = useMemo(() => new StaticPersistenceManager({}), []);
  return (
    <PersistenceProvider persistenceManager={persistNothing}>
      <Shell
        shellLayoutProps={{
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
    </PersistenceProvider>
  );
};
InlayLeftPanel.displaySequence = displaySequence++;

export const SimpleShellCustomPlaceholder = () => {
  const persistNothing = useMemo(() => new StaticPersistenceManager({}), []);

  const workspaceProps = useMemo<WorkspaceProps>(() => {
    const placeHolder = {
      type: "Placeholder",
      props: {
        style: {
          background: "yellow",
        },
      },
    };
    return {
      layoutJSON: placeHolder,
      layoutPlaceholderJSON: placeHolder,
    };
  }, []);
  return (
    <PersistenceProvider persistenceManager={persistNothing}>
      <Shell
        workspaceProps={workspaceProps}
        user={user}
        style={
          {
            "--vuuShell-height": "100%",
            "--vuuShell-width": "100%",
          } as CSSProperties
        }
      ></Shell>
    </PersistenceProvider>
  );
};

SimpleShellCustomPlaceholder.displaySequence = displaySequence++;
