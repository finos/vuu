import { DraggableLayout, Flexbox } from "@finos/vuu-layout";
import { ContextPanel } from "./context-panel";

import { ReactElement } from "react";

import { LeftNav } from "../left-nav";

export const useFullHeightLeftPanel = ({
  appHeader,
}: {
  appHeader: ReactElement;
}): ReactElement => {
  return (
    <Flexbox
      className="App"
      style={{
        flexDirection: "row",
        height: "100%",
        width: "100%",
      }}
    >
      <LeftNav
        style={{
          width: 240,
        }}
      />
      <Flexbox
        className="vuuShell-content"
        style={{
          flexDirection: "column",
          flex: 1,
          padding: 8,
        }}
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
