import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { getRegisteredCellRenderers } from "@finos/vuu-utils";
import { Dropdown } from "@heswell/salt-lab";
import { Panel, PanelProps } from "@salt-ds/core";
import cx from "classnames";
import { Dispatch, useMemo } from "react";
import { ColumnAction } from "../settings-panel/useGridSettings";
import { NumericColumnPanel } from "./NumericColumnPanel";
import { StringColumnPanel } from "./StringColumnPanel";

import "./ColumnTypePanel.css";

const classBase = "vuuColumnTypePanel";

export interface ColumnTypePanelProps extends PanelProps {
  column: ColumnDescriptor;
  dispatchColumnAction: Dispatch<ColumnAction>;
}

const integerCellRenderers = ["Default Renderer (int, long)"];
const doubleCellRenderers = ["Default Renderer (double)"];
const stringCellRenderers = ["Default Renderer (string)"];

const getAvailableCellRenderers = (column: ColumnDescriptor) => {
  const customCellRenderers = getRegisteredCellRenderers(column.serverDataType);
  const customRendererNames = customCellRenderers.map((r) => r.name);
  console.log({ customRendererNames });

  switch (column.serverDataType) {
    case "char":
    case "string":
      return stringCellRenderers;
    case "int":
    case "long":
      return integerCellRenderers;
    case "double":
      return doubleCellRenderers.concat(customRendererNames);
    default:
      return stringCellRenderers;
  }
};

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
  const availableRenderers = getAvailableCellRenderers(column);

  return (
    <>
      <Dropdown
        className={cx(`${classBase}-renderer`)}
        fullWidth
        selected={availableRenderers[0]}
        source={availableRenderers}
      />
      <Panel
        {...props}
        className={cx(classBase, className, `${classBase}-${serverDataType}`)}
      >
        {content}
      </Panel>
    </>
  );
};
