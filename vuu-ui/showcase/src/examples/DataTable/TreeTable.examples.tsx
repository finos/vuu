import { TreeTable } from "@finos/vuu-datatable";

import showcaseData from "./Tree.data";

let displaySequence = 1;

export const ShowcaseTree = () => {
  return (
    <TreeTable rowHeight={30} showColumnHeaders={false} source={showcaseData} />
  );
};
ShowcaseTree.displaySequence = displaySequence++;

export const ShowcaseTreeSelected = () => {
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: "1 1 0" }}>
        <TreeTable
          rowHeight={30}
          defaultSelectedKeyValues={[
            "$root|Filters|FilterBar|FilterBar|DefaultFilterBar",
          ]}
          showColumnHeaders={false}
          source={showcaseData}
        />
      </div>
    </div>
  );
};
ShowcaseTreeSelected.displaySequence = displaySequence++;

export const ShowcaseTreeSelectedAutoReveal = () => {
  console.log({ showcaseData });

  return (
    <TreeTable
      rowHeight={30}
      defaultSelectedKeyValues={[
        "$root|Filters|FilterBar|FilterBar|DefaultFilterBar",
      ]}
      revealSelected
      showColumnHeaders={false}
      source={showcaseData}
    />
  );
};
ShowcaseTreeSelectedAutoReveal.displaySequence = displaySequence++;
