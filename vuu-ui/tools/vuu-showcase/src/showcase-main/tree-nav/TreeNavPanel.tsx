import { TreeTable, type TreeTableProps } from "@finos/vuu-datatable";
import { View, type ViewProps } from "@finos/vuu-layout";
import { VuuInput } from "@finos/vuu-ui-controls";
import cx from "clsx";
import { useTreeNavPanel } from "./useTreeNavPanel";

import "./TreeNavPanel.css";
import { TreeDataSource } from "@finos/vuu-data-local";
import { useMemo } from "react";
import { TreeSourceNode } from "@finos/vuu-utils";

const classBase = "vuuTreeNavPanel";

export interface TreeNavPanelProps
  extends Pick<
      TreeTableProps,
      "className" | "defaultSelectedKeyValues" | "onSelect" | "style"
    >,
    Pick<ViewProps, "resizeable"> {
  source: TreeSourceNode[];
}
export const TreeNavPanel = ({
  className,
  defaultSelectedKeyValues,
  onSelect,
  resizeable,
  source,
  style,
}: TreeNavPanelProps) => {
  const { onCommit } = useTreeNavPanel();

  const dataSource = useMemo(
    () => new TreeDataSource({ data: source }),
    [source],
  );

  return (
    <View
      className={cx(classBase, className)}
      resizeable={resizeable}
      style={style}
    >
      <div className={`${classBase}-search`}>
        <VuuInput onCommit={onCommit} />
      </div>
      <div className={`${classBase}-treeContainer`}>
        <TreeTable
          dataSource={dataSource}
          defaultSelectedKeyValues={defaultSelectedKeyValues}
          rowHeight={30}
          showColumnHeaders={false}
          onSelect={onSelect}
          revealSelected
          width="100%"
        />
      </div>
    </View>
  );
};
