import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import cx from "classnames";

import {
  getCalculatedColumnDetails,
  isCalculatedColumn,
} from "@finos/vuu-utils";

import "./ColumnNameLabel.css";
import { MouseEventHandler } from "react";

const classBase = "vuuColumnNameLabel";

export interface ColumnNameLabelProps {
  column: ColumnDescriptor;
  onClick: MouseEventHandler;
}

export const ColumnNameLabel = ({ column, onClick }: ColumnNameLabelProps) => {
  if (isCalculatedColumn(column.name)) {
    const [name, type, expression] = getCalculatedColumnDetails(column);
    const displayName = name || "name";
    const displayExpression = "=expression";

    const nameClass =
      displayName === "name" ? `${classBase}-placeholder` : undefined;
    const expressionClass =
      expression === "" ? `${classBase}-placeholder` : undefined;
    return (
      <div
        className={cx(classBase, `${classBase}-calculated`)}
        onClick={onClick}
      >
        <span className={nameClass}>{displayName}</span>
        <span>:</span>
        <span>{type || "string"}</span>
        <span>:</span>
        <span className={expressionClass}>{displayExpression}</span>
        <span className={`${classBase}-edit`} data-icon="edit" />
      </div>
    );
  } else {
    return <div className={classBase}>{column.name}</div>;
  }
};
