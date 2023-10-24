import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  getCalculatedColumnDetails,
  setCalculatedColumnExpression,
  setCalculatedColumnName,
  setCalculatedColumnType,
} from "@finos/vuu-utils";
import { FormEventHandler, useCallback, useRef, useState } from "react";
import { ColumnExpressionPanelProps } from "./ColumnExpressionPanel";

export type ColumnExpressionHookProps = Pick<
  ColumnExpressionPanelProps,
  "column" | "onChangeName" | "onSave"
>;

const applyDefaults = (column: ColumnDescriptor) => {
  const [name, expression, type] = getCalculatedColumnDetails(column);
  if (type === "") {
    return {
      ...column,
      name: `${name}:${expression}:string`,
    };
  } else {
    return column;
  }
};

export const useColumnExpression = ({
  column: columnProp,
  onChangeName: onChangeNameProp,
  onSave: onSaveProp,
}: ColumnExpressionHookProps) => {
  const [column, setColumn] = useState<ColumnDescriptor>(
    applyDefaults(columnProp)
  );
  // We need to track column name in a ref because ColunExpressionInput
  // is not a pure React component, it hosts a CodeMirror editor. We
  // do not want to cause it to render mid-edit. Therefore it uses memo
  // and only renders on initial load. onChangeExpression must be stable.
  const columnNameRef = useRef<string>(column.name);
  const expressionRef = useRef(getCalculatedColumnDetails(column)[1]);

  const onChangeName = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      const newColumn = setCalculatedColumnName(column, value);
      columnNameRef.current = newColumn.name;
      setColumn(newColumn);
      onChangeNameProp?.(newColumn.name);
    },
    [column, onChangeNameProp]
  );

  const onChangeExpression = useCallback(
    (value: string) => {
      // we do not set state when this changes as the codemirror editor
      // manages state of the expression for us until complete
      const expression = value.trim();
      expressionRef.current = expression;
      const [name, , type] = columnNameRef.current.split(":");
      columnNameRef.current = `${name}:${expression}:${type}`;
      onChangeNameProp?.(columnNameRef.current);
    },
    [onChangeNameProp]
  );

  const onChangeType = useCallback(
    (evt, value: string | null) => {
      if (typeof value === "string") {
        const newColumn = setCalculatedColumnType(column, value);
        setColumn(newColumn);
        onChangeNameProp?.(newColumn.name);
      }
    },
    [column, onChangeNameProp]
  );

  const onSave = useCallback(() => {
    const newColumn = setCalculatedColumnExpression(
      column,
      expressionRef.current
    );
    setColumn(newColumn);
    onSaveProp(newColumn);
  }, [column, onSaveProp]);

  return {
    column,
    onChangeExpression,
    onChangeName,
    onChangeType,
    onSave,
  };
};
