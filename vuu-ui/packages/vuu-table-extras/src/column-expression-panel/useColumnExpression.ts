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
  "column" | "onSave"
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
  onSave: onSaveProp,
}: ColumnExpressionHookProps) => {
  const [column, setColumn] = useState<ColumnDescriptor>(
    applyDefaults(columnProp)
  );
  const expressionRef = useRef(getCalculatedColumnDetails(column)[1]);

  const onChangeName = useCallback<FormEventHandler>((evt) => {
    const { value } = evt.target as HTMLInputElement;
    setColumn((state) => setCalculatedColumnName(state, value));
  }, []);

  const onChangeExpression = useCallback((value: string) => {
    // we do not set state when this changes as the codemirror editor
    // manages state of the expression for us until complete
    expressionRef.current = value.trim();
  }, []);

  const onChangeType = useCallback((evt, value: string | null) => {
    if (typeof value === "string") {
      setColumn((state) => setCalculatedColumnType(state, value));
    }
  }, []);

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
