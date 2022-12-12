import React from "react";
import cx from "classnames";
import { typeOf } from "../../utils";

import "./layout-tree-viewer.css";
import { Tree } from "@vuu-ui/ui-controls";

const classBaseTree = "hwLayoutTreeViewer";

const toTreeJson = (component, path = "0") => {
  return {
    label: typeOf(component),
    path,
    childNodes: React.Children.map(component.props.children, (child, i) =>
      toTreeJson(child, path ? `${path}.${i}` : `${i}`)
    ),
  };
};

export const LayoutTreeViewer = ({ layout, onSelect, style }) => {
  const treeJson = [toTreeJson(layout)];

  const handleSelection = (evt, [{ path }]) => {
    onSelect(path);
  };

  return (
    <div className={cx(classBaseTree)} style={style}>
      <Tree
        source={treeJson}
        groupSelection="single"
        onSelectionChange={handleSelection}
      />
    </div>
  );
};
