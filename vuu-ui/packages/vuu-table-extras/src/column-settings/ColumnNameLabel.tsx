import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import cx from "classnames";

import {
  getCalculatedColumnDetails,
  isCalculatedColumn,
} from "@finos/vuu-utils";

import "./ColumnNameLabel.css";

const classBase = "vuuColumnNameLabel";

export interface ColumnNameLabelProps {
  column: ColumnDescriptor;
}

export const ColumnNameLabel = ({ column }: ColumnNameLabelProps) => {
  if (isCalculatedColumn(column.name)) {
    const [name, expression, type] = getCalculatedColumnDetails(column);
    const displayName = name || "name";
    const displayExpression = "expression";

    const nameClass =
      displayName === "name" ? `${classBase}-placeholder` : undefined;
    const expressionClass =
      expression === "" ? `${classBase}-placeholder` : undefined;
    return (
      <div className={cx(classBase, `${classBase}-calculated`)}>
        <span className={nameClass}>{displayName}</span>
        <span>:</span>
        <span className={expressionClass}>{displayExpression}</span>
        <span>:</span>
        <span>{type || "string"}</span>
      </div>
    );
  } else {
    return <div className={classBase}>{column.name}</div>;
  }
};
