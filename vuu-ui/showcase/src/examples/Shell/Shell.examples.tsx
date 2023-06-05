import { Shell } from "@finos/vuu-shell";
import { AppSidePanel } from "app-vuu-example/src/app-sidepanel";
import { CSSProperties, useMemo } from "react";
import { useMockFeatureData } from "../utils/mock-data";
import { useAutoLoginToVuuServer } from "../utils";

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
  const defaultLayout = useMemo(() => {
    return {
      type: "Stack",
      props: {
        style: {
          width: "100%",
          height: "100%",
        },
        showTabs: true,
        enableAddTab: true,
        preserve: true,
        active: 0,
      },
      children: [
        {
          type: "View",
          title: "Page 1",
          style: { height: "calc(100% - 6px)" },
          children: [
            {
              type: "Placeholder",
            },
          ],
        },
      ],
    };
  }, []);

  return (
    <Shell
      defaultLayout={defaultLayout}
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

export const ShellWithFullHeightLeftPanel = () => {
  const { features, schemas } = useMockFeatureData();
  return (
    <Shell
      leftSidePanelLayout="full-height"
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

ShellWithFullHeightLeftPanel.displaySequence = displaySequence++;

export const ShellWithDefaultLayoutAndLeftPanel = () => {
  const error = useAutoLoginToVuuServer();

  const { features, schemas } = useMockFeatureData();
  const defaultLayout = useMemo(() => {
    return {
      type: "Stack",
      props: {
        style: {
          width: "100%",
          height: "100%",
        },
        showTabs: true,
        enableAddTab: true,
        preserve: true,
        active: 0,
      },
      children: [
        {
          type: "View",
          title: "Page 1",
          style: { height: "calc(100% - 6px)" },
          children: [
            {
              type: "Placeholder",
            },
          ],
        },
      ],
    };
  }, []);

  if (error) {
    return error;
  }

  return (
    <Shell
      defaultLayout={defaultLayout}
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
