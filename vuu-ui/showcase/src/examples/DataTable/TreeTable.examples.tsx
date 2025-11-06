import { TreeTable } from "@vuu-ui/vuu-datatable";

import showcaseData from "./Tree.data";
import { ChangeEventHandler, useCallback, useMemo, useState } from "react";
import { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { TableRowSelectHandler } from "@vuu-ui/vuu-table-types";
import { TreeDataSource } from "@vuu-ui/vuu-data-local";
import { Input } from "@salt-ds/core";

export const ShowcaseTree = () => {
  return (
    <TreeTable rowHeight={30} showColumnHeaders={false} source={showcaseData} />
  );
};

export const ShowcaseTreeSelected = () => {
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: "1 1 0" }}>
        <TreeTable
          rowHeight={30}
          autoSelectRowKey="$root|Filters|FilterBar|FilterBar|DefaultFilterBar"
          showColumnHeaders={false}
          source={showcaseData}
        />
      </div>
    </div>
  );
};

export const ShowcaseTreeSelectedAutoReveal = () => {
  console.log({ showcaseData });

  return (
    <TreeTable
      rowHeight={30}
      autoSelectRowKey="$root|Filters|FilterBar|FilterBar|DefaultFilterBar"
      revealSelected
      showColumnHeaders={false}
      source={showcaseData}
    />
  );
};

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
