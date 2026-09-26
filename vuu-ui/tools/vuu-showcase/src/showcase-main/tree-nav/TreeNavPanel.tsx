import { TreeTable, type TreeTableProps } from "@vuu-ui/vuu-datatable";
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
    > {
  source: TreeSourceNode[];
}
export const TreeNavPanel = ({
  className,
  autoSelectRowKey,
  onSelect,
  source,
  style,
}: TreeNavPanelProps) => {
  const { dataSource, onChange, searchPattern } = useTreeNavPanel({ source });

  return (
    <div className={classBase}>
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
      </div>
  );
};
