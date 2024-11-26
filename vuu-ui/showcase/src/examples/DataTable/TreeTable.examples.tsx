import { TreeTable } from "@finos/vuu-datatable";

import showcaseData from "./Tree.data";
import {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { TreeSourceNode } from "@finos/vuu-utils";
import { TableRowSelectHandler } from "@finos/vuu-table-types";
import { TreeDataSource } from "@finos/vuu-data-local";
import { VuuInput } from "@finos/vuu-ui-controls";
import { Input } from "@salt-ds/core";

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

const addDataNodes = (
  treeNodes: TreeSourceNode[],
  index = { value: 0 },
): Array<TreeSourceNode<string>> => {
  return treeNodes?.map<TreeSourceNode<string>>(({ childNodes, ...rest }) => ({
    ...rest,
    nodeData: `node-${index.value++}`,
    childNodes: childNodes ? addDataNodes(childNodes, index) : undefined,
  }));
};

export const ShowcaseTreeNodeOptions = () => {
  const source = useMemo(() => {
    return addDataNodes(showcaseData);
  }, []);

  const onSelect: TableRowSelectHandler = (row) => {
    console.log({ row });
  };

  return (
    <TreeTable
      onSelect={onSelect}
      rowHeight={30}
      showColumnHeaders={false}
      source={source}
    />
  );
};
ShowcaseTreeNodeOptions.displaySequence = displaySequence++;

export const TreeTableSearch = () => {
  const dataSource = useMemo(
    () => new TreeDataSource({ data: showcaseData }),
    [],
  );

  const onSelect: TableRowSelectHandler = (row) => {
    console.log({ row });
  };

  const [value, setValue] = useState<string>("");

  const handleChange = useCallback<ChangeEventHandler<HTMLInputElement>>(
    (evt) => {
      const value = evt.target.value.trim();
      setValue(value);

      if (value === "") {
        dataSource.filter = { filter: "" };
      } else {
        dataSource.filter = { filter: `label contains "${value}"` };
      }
    },
    [dataSource],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: 400,
      }}
    >
      <div style={{ flex: "0 0 32px", padding: 12 }}>
        <Input onChange={handleChange} />
      </div>
      <div style={{ flex: 1 }}>
        <TreeTable
          onSelect={onSelect}
          rowHeight={30}
          searchPattern={value}
          showColumnHeaders={false}
          dataSource={dataSource}
        />
      </div>
    </div>
  );
};
TreeTableSearch.displaySequence = displaySequence++;
