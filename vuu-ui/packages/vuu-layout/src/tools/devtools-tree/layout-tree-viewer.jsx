import React from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { typeOf } from "../../utils";

import layoutTreeViewer from "./layout-tree-viewer.css";
import { TreeTable } from "@vuu-ui/vuu-datatable";

const classBaseTree = "hwLayoutTreeViewer";

const toTreeJson = (component, path = "0") => {
  return {
    label: typeOf(component),
    path,
    childNodes: React.Children.map(component.props.children, (child, i) =>
      toTreeJson(child, path ? `${path}.${i}` : `${i}`),
    ),
  };
};

export const LayoutTreeViewer = ({ layout, onSelect: _, style }) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-layout-tree-viewer",
    css: layoutTreeViewer,
    window: targetWindow,
  });

  const treeJson = [toTreeJson(layout)];

  const handleSelection = (row) => {
    console.log({ row });
    // onSelect(path);
  };

  return (
    <div className={cx(classBaseTree)} style={style}>
      <TreeTable
        source={treeJson}
        selectionModel="single"
        onSelect={handleSelection}
      />
    </div>
  );
};
