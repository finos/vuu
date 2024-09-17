import { LayoutContainer, Flexbox } from "@finos/vuu-layout";
import { VuuShellLocation } from "@finos/vuu-utils";
import { ContextPanel } from "../context-panel";
import { SidePanel } from "../side-panel";
import { ShellLayoutTemplateHook } from "../useShellLayout";
import { useMemo } from "react";
import { ApplicationStatusBar } from "../../app-status-bar";

export const useFullHeightLeftPanel: ShellLayoutTemplateHook = ({
  appHeader,
  SidePanelProps: LeftSidePanelProps,
  htmlAttributes,
}) =>
  useMemo(
    () => (
      <Flexbox
        {...htmlAttributes}
        style={{
          ...htmlAttributes?.style,
          flexDirection: "row",
        }}
      >
        <SidePanel {...LeftSidePanelProps} id={VuuShellLocation.SidePanel} />
        <Flexbox
          className="vuuShell-content"
          style={{ flex: 1, flexDirection: "column" }}
        >
          {appHeader}
          <LayoutContainer
            id={VuuShellLocation.WorkspaceContainer}
            key="main-content"
            style={{ flex: 1 }}
          />
          <ApplicationStatusBar />
        </Flexbox>
        <ContextPanel id={VuuShellLocation.ContextPanel} overlay></ContextPanel>
      </Flexbox>
    ),
    [LeftSidePanelProps, appHeader, htmlAttributes],
  );
