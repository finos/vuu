import React from "react";
import { createRoot } from "react-dom/client";
import { Showcase, ShowcaseStandalone } from "@vuu-ui/vuu-showcase";
import { hasUrlParameter, type TreeSourceNode } from "@vuu-ui/vuu-utils";
import type { ExhibitImporter } from "./shared-utils";

function start(treeSource: TreeSourceNode[], importExhibit?: ExhibitImporter) {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    if (hasUrlParameter("standalone")) {
      root.render(
        React.createElement(ShowcaseStandalone, { importExhibit, treeSource }),
      );
    } else {
      root.render(React.createElement(Showcase, { treeSource }));
    }
  } else {
    throw Error("document does not contain #root wlwmwnt");
  }
}

export default start;
