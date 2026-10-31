import { GridLayout, GridLayoutItem } from "@heswell/grid-layout";
import { ApplicationSettingsContextPanel } from "../context-panel";
import { SidePanel } from "../side-panel";
import type { ShellLayoutTemplateHook } from "../useShellLayout";

export const useFullHeightLeftPanel: ShellLayoutTemplateHook = ({
  appHeader,
  SidePanelProps,
  htmlAttributes,
  workspaceHost,
}) => {
  const { onChange: _onChange, ...gridAttributes } = htmlAttributes ?? {};
  return (
    <GridLayout
      {...gridAttributes}
      className={`${htmlAttributes?.className ?? ""} vuuShell-staticGrid`}
      colsAndRows={{
        cols: [`${SidePanelProps?.sizeOpen ?? 200}px`, "1fr", "0px"],
        rows: ["40px", "1fr"],
      }}
      id="vuu-shell-grid"
    >
      <GridLayoutItem id="vuu-shell-left-nav" style={{ gridArea: "1/1/3/2" }}>
        <SidePanel {...SidePanelProps} id="vuu-side-panel" />
      </GridLayoutItem>
      <GridLayoutItem id="vuu-shell-header" style={{ gridArea: "1/2/2/3" }}>
        {appHeader}
      </GridLayoutItem>
      <GridLayoutItem
        className="vuuShell-content"
        id="vuu-shell-workspace-host"
        style={{ gridArea: "2/2/3/3" }}
      >
        {workspaceHost}
      </GridLayoutItem>
      <GridLayoutItem id="vuu-shell-context" style={{ gridArea: "1/3/3/4" }}>
        <ApplicationSettingsContextPanel />
      </GridLayoutItem>
    </GridLayout>
  );
};
