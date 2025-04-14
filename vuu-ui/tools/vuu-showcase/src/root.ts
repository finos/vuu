import React from "react";
import ReactDOM from "react-dom";
import { Showcase, ShowcaseStandalone } from "@finos/vuu-showcase";
import { hasUrlParameter, TreeSourceNode } from "@finos/vuu-utils";

function start(treeSource: TreeSourceNode[]) {
  const root = document.getElementById("root");
  if (hasUrlParameter("standalone")) {
    ReactDOM.render(
      React.createElement(ShowcaseStandalone, { treeSource }),
      root,
    );
  } else {
    ReactDOM.render(React.createElement(Showcase, { treeSource }), root);
  }
}

export default start;
