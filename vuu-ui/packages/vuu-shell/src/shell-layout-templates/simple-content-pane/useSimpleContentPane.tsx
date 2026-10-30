import { GridLayout, GridLayoutItem } from "@heswell/grid-layout";
import { ApplicationSettingsContextPanel } from "../context-panel";
import type { ShellLayoutTemplateHook } from "../useShellLayout";

export const useSimpleContentPane: ShellLayoutTemplateHook = ({
  appHeader,
  htmlAttributes,
  workspaceHost,
}) => {
  const { onChange: _onChange, ...gridAttributes } = htmlAttributes ?? {};
  return (
    <GridLayout
      {...gridAttributes}
      className={`${htmlAttributes?.className ?? ""} vuuShell-staticGrid`}
      colsAndRows={{ cols: ["1fr", "0px"], rows: ["40px", "1fr"] }}
      id="vuu-shell-grid"
    >
      <GridLayoutItem id="vuu-shell-header" style={{ gridArea: "1/1/2/2" }}>
        {appHeader}
      </GridLayoutItem>
      <GridLayoutItem
        className="vuuShell-content"
        id="vuu-shell-workspace-host"
        style={{ gridArea: "2/1/3/2" }}
      >
        {workspaceHost}
      </GridLayoutItem>
      <GridLayoutItem id="vuu-shell-context" style={{ gridArea: "1/2/3/3" }}>
        <ApplicationSettingsContextPanel />
      </GridLayoutItem>
    </GridLayout>
  );
};
