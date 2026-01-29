import {
  Placeholder,
  useLayoutOperation,
  useLayoutProviderDispatch,
} from "@vuu-ui/vuu-layout";
import {
  PersistenceProvider,
  Shell,
  StaticPersistenceManager,
  WorkspaceProps,
  defaultWorkspaceJSON,
} from "@vuu-ui/vuu-shell";
import { Tab, Tabstrip } from "@vuu-ui/vuu-ui-controls";
import { VuuShellLocation, registerComponent } from "@vuu-ui/vuu-utils";
import { Button } from "@salt-ds/core";
import {
  CSSProperties,
  HTMLAttributes,
  useCallback,
  useMemo,
  useState,
} from "react";

registerComponent("Placeholder", Placeholder, "component");

const user = { username: "test-user", token: "test-token" };

const htmlAttributes = {
  "data-testid": "shell",
} as HTMLAttributes<HTMLDivElement>;

export const DefaultShell = () => {
  return (
    <Shell
      shellLayoutProps={{
        htmlAttributes: htmlAttributes,
      }}
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

export const SimpleShellNoWorkspaceTabs = () => {
  return (
    <Shell
      workspaceProps={{
        showTabs: false,
      }}
      shellLayoutProps={{
        htmlAttributes: htmlAttributes,
      }}
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

export const FullHeightLeftPanel = () => {
  return (
    <Shell
      shellLayoutProps={{
        SidePanelProps: {
          children: <div className="My Left Side">My left Side</div>,
          sizeOpen: 200,
        },
        layoutTemplateId: "full-height",
      }}
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

export const FullHeightLeftPanelLeftPanelClosed = () => {
  return (
    <Shell
      shellLayoutProps={{
        SidePanelProps: {
          children: <div className="My Left Side">My left Side</div>,
          open: false,
          sizeOpen: 200,
          sizeClosed: 60,
        },
        layoutTemplateId: "full-height",
      }}
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

export const InlayLeftPanel = () => {
  const persistNothing = useMemo(() => new StaticPersistenceManager({}), []);
  return (
    <PersistenceProvider persistenceManager={persistNothing}>
      <Shell
        shellLayoutProps={{
          SidePanelProps: {
            children: <div className="My Left Side">My left Side</div>,
            sizeOpen: 200,
          },
          layoutTemplateId: "inlay",
        }}
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

const ToolbarTabs = () => {
  const dispatchLayoutAction = useLayoutProviderDispatch();
  const [active, setActive] = useState(0);
  const handleTabSelection = useCallback(
    (active: number) => {
      console.log(`switch tab ${active}`);
      dispatchLayoutAction({
        type: "set-props",
        path: `#${VuuShellLocation.MultiWorkspaceContainer}`,
        props: { active },
      });
      setActive(active);
    },
    [dispatchLayoutAction],
  );

  return (
    <Tabstrip
      activeTabIndex={active}
      animateSelectionThumb={false}
      onActiveChange={handleTabSelection}
      orientation="vertical"
      style={{ "--overflow-container-width": "100%" } as CSSProperties}
    >
      <Tab data-icon="home" />
      <Tab data-icon="preview" />
      <Tab data-icon="workspace" />
    </Tabstrip>
  );
};

const LayoutWithLink = ({ label }: { label: string }) => {
  const { addComponentToWorkspace, switchWorkspace } = useLayoutOperation();
  const onClick = useCallback(() => {
    addComponentToWorkspace(<Placeholder title={label} />);
    switchWorkspace(2);
  }, [addComponentToWorkspace, label, switchWorkspace]);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Button onClick={onClick}>Click Me ({label})</Button>
    </div>
  );
};

registerComponent("LayoutWithLink", LayoutWithLink, "view");

export const LeftMainTabs = () => {
  const persistNothing = useMemo(() => new StaticPersistenceManager({}), []);
  return (
    <PersistenceProvider persistenceManager={persistNothing}>
      <Shell
        shellLayoutProps={{
          ToolbarProps: {
            children: <ToolbarTabs />,
            width: 50,
          },
          htmlAttributes: {
            style: {
              padding: "4px 4px 4px 0",
            },
          },
          layoutTemplateId: "left-main-tabs",
        }}
        workspaceProps={{
          workspaceJSON: [
            {
              type: "LayoutWithLink",
              props: { label: "Steve", style: { background: "red" } },
            },
            {
              type: "LayoutWithLink",
              props: { label: "Martha", style: { background: "red" } },
            },
            defaultWorkspaceJSON,
          ],
        }}
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

export const SimpleShellCustomPlaceholder = () => {
  const persistNothing = useMemo(() => new StaticPersistenceManager({}), []);

  const workspaceProps = useMemo<WorkspaceProps>(() => {
    const placeHolder = {
      type: "Placeholder",
      props: {
        "data-testid": "custom-placeholder",
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
        shellLayoutProps={{
          htmlAttributes: htmlAttributes,
        }}
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

export const SimpleShellMultiLayouts = () => {
  const persistNothing = useMemo(() => new StaticPersistenceManager({}), []);

  const workspaceProps = useMemo<WorkspaceProps>(() => {
    const layoutPlaceholderJSON = {
      type: "Placeholder",
      props: {
        "data-testid": "custom-placeholder",
        style: {
          background: "yellow",
        },
      },
    };
    const layoutJSON = [
      {
        type: "Placeholder",
        props: {
          style: {
            background: "yellow",
          },
        },
      },
      {
        type: "Placeholder",
        props: {
          "data-testid": "custom-placeholder2",
          style: {
            background: "red",
          },
        },
      },
      {
        type: "Placeholder",
        props: {
          style: {
            background: "green",
          },
        },
      },
    ];
    return {
      layoutJSON,
      layoutPlaceholderJSON,
      activeLayoutIndex: 1,
    };
  }, []);

  return (
    <PersistenceProvider persistenceManager={persistNothing}>
      <Shell
        shellLayoutProps={{
          htmlAttributes: htmlAttributes,
        }}
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
