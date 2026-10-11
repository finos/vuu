import React from "react";
import { createRoot } from "react-dom/client";
import {
  DocsStandalone,
  Showcase,
  ShowcaseStandalone,
} from "@vuu-ui/vuu-showcase";
import { hasUrlParameter, type TreeSourceNode } from "@vuu-ui/vuu-utils";
import { type ExhibitImporter, isStandaloneDocument } from "./shared-utils";

function start(treeSource: TreeSourceNode[], importExhibit?: ExhibitImporter) {
  const container = document.getElementById("root");
  if (container) {
    const root = createRoot(container);
    if (hasUrlParameter("standalone")) {
      root.render(
        isStandaloneDocument(treeSource)
          ? React.createElement(DocsStandalone, { importExhibit, treeSource })
          : React.createElement(ShowcaseStandalone, {
              importExhibit,
              treeSource,
            }),
      );
    } else {
      root.render(React.createElement(Showcase, { importExhibit, treeSource }));
    }
  } else {
    throw Error("document does not contain #root element");
  }
}

export default start;
