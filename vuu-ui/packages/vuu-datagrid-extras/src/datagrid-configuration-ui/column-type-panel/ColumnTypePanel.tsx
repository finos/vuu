import { Dispatch, useMemo } from "react";
import cx from "classnames";
import { ColumnDescriptor } from "@finos/vuu-datagrid/src/grid-model";
import { NumericColumnPanel } from "./NumericColumnPanel";
import { StringColumnPanel } from "./StringColumnPanel";

import "./ColumnTypePanel.css";
import { Panel, PanelProps } from "@heswell/salt-lab";
import { ColumnAction } from "../settings-panel/useColumns";

const classBase = "vuuColumnTypepanel";

export interface ColumnTypePanelProps extends PanelProps {
  column: ColumnDescriptor;
  dispatchColumnAction: Dispatch<ColumnAction>;
}

export const ColumnTypePanel = ({
  className,
  column,
  dispatchColumnAction,
  ...props
}: ColumnTypePanelProps) => {
  const content = useMemo(() => {
    switch (column.serverDataType) {
      case "double":
      case "int":
      case "long":
        return (
          <NumericColumnPanel
            column={column}
            dispatchColumnAction={dispatchColumnAction}
          />
        );
      default:
        return (
          <StringColumnPanel
            column={column}
            dispatchColumnAction={dispatchColumnAction}
          />
        );
    }
  }, [column, dispatchColumnAction]);

  const { serverDataType = "string" } = column;

  return (
    <Panel
      {...props}
      className={cx(classBase, className, `${classBase}-${serverDataType}`)}
    >
      {content}
    </Panel>
  );
};
