import React from "react";
import { createRoot } from "react-dom/client";
import { Showcase, ShowcaseStandalone } from "@vuu-ui/vuu-showcase";
import { hasUrlParameter, TreeSourceNode } from "@vuu-ui/vuu-utils";

function start(treeSource: TreeSourceNode[]) {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    if (hasUrlParameter("standalone")) {
      root.render(React.createElement(ShowcaseStandalone, { treeSource }));
    } else {
      root.render(React.createElement(Showcase, { treeSource }));
    }
  } else {
    throw Error("document does not contain #root wlwmwnt");
  }
}

export default start;
