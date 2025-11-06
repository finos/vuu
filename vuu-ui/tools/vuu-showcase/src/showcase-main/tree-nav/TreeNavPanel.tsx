import { TreeTable, type TreeTableProps } from "@vuu-ui/vuu-datatable";
import { View, type ViewProps } from "@vuu-ui/vuu-layout";
import cx from "clsx";
import { useTreeNavPanel } from "./useTreeNavPanel";
import { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { Input } from "@salt-ds/core";

import "./TreeNavPanel.css";

const classBase = "vuuTreeNavPanel";

export interface TreeNavPanelProps
  extends Pick<
      TreeTableProps,
      "className" | "autoSelectRowKey" | "onSelect" | "style"
    >,
    Pick<ViewProps, "resizeable"> {
  source: TreeSourceNode[];
}
export const TreeNavPanel = ({
  className,
  autoSelectRowKey,
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
          autoSelectRowKey={autoSelectRowKey}
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
