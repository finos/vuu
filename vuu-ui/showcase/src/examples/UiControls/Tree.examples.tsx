import { Tree } from "@finos/vuu-ui-controls";
import { TreeTable } from "@finos/vuu-datatable";

import showcaseData from "./Tree.data";

console.log({ showcaseData });

let displaySequence = 1;

export const ShowcaseTree = () => {
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Tree source={showcaseData} style={{ flex: "1 1 0" }} />
      {/* <div style={{ flex: "1 1 0" }}>
        <JsonTable source={showcaseData} />
      </div> */}
      <div style={{ flex: "1 1 0" }}>
        <TreeTable
          rowHeight={30}
          showColumnHeaders={false}
          source={showcaseData}
        />
      </div>
    </div>
  );
};
ShowcaseTree.displaySequence = displaySequence++;
