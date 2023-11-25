import { DraggableLayout, Flexbox } from "@finos/vuu-layout";
import { ReactElement } from "react";
import { ContextPanel } from "./context-panel";
import { SidePanel } from "./side-panel";
import { ShellLayoutProps } from "./useShellLayout";

export const useFullHeightLeftPanel = ({
  appHeader,
  LeftSidePanelProps,
}: ShellLayoutProps): ReactElement => {
  return (
    <Flexbox
      className="App"
      style={{
        flexDirection: "row",
        height: "100%",
        width: "100%",
      }}
    >
      <SidePanel {...LeftSidePanelProps} id="vuu-side-panel" />
      <Flexbox
        className="vuuShell-content"
        style={{ flex: 1, flexDirection: "column" }}
      >
        {appHeader}
        <DraggableLayout dropTarget key="main-content" style={{ flex: 1 }} />
      </Flexbox>
      <ContextPanel
        id="context-panel"
        overlay
        title="Column Settings"
      ></ContextPanel>
    </Flexbox>
  );
};
