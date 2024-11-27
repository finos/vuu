import { TreeTable, type TreeTableProps } from "@finos/vuu-datatable";
import { View, type ViewProps } from "@finos/vuu-layout";
import cx from "clsx";
import { useTreeNavPanel } from "./useTreeNavPanel";
import { TreeSourceNode } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";

import "./TreeNavPanel.css";

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
  const { dataSource, onChange, searchPattern } = useTreeNavPanel({ source });

  return (
    <View
      className={cx(classBase, className)}
      resizeable={resizeable}
      style={style}
    >
      <div className={`${classBase}-search`}>
        <Input onChange={onChange} />
      </div>
      <div className={`${classBase}-treeContainer`}>
        <TreeTable
          dataSource={dataSource}
          defaultSelectedKeyValues={defaultSelectedKeyValues}
          rowHeight={30}
          showColumnHeaders={false}
          onSelect={onSelect}
          revealSelected
          searchPattern={searchPattern}
          width="100%"
        />
      </div>
    </View>
  );
};
