import { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  getCalculatedColumnDetails,
  isVuuColumnDataType,
  setCalculatedColumnExpression,
  setCalculatedColumnName,
  setCalculatedColumnType,
} from "@finos/vuu-utils";
import { FormEventHandler, useCallback, useRef, useState } from "react";
import { ColumnExpressionPanelProps } from "./ColumnExpressionPanel";

export type ColumnExpressionHookProps = Pick<
  ColumnExpressionPanelProps,
  "column" | "onChangeName" | "onChangeServerDataType"
>;

const applyDefaults = (column: ColumnDescriptor) => {
  const [name, expression, type] = getCalculatedColumnDetails(column);
  if (type === "") {
    return {
      ...column,
      name: `${name}:string:${expression}`,
    };
  } else {
    return column;
  }
};

export const useColumnExpression = ({
  column: columnProp,
  onChangeName: onChangeNameProp,
  onChangeServerDataType: onChangeServerDataTypeProp,
}: ColumnExpressionHookProps) => {
  const [column, _setColumn] = useState<ColumnDescriptor>(
    applyDefaults(columnProp)
  );
  const columnRef = useRef<ColumnDescriptor>(columnProp);
  const setColumn = useCallback((column: ColumnDescriptor) => {
    columnRef.current = column;
    _setColumn(column);
  }, []);

  // We need to track column name in a ref because ColunExpressionInput
  // is not a pure React component, it hosts a CodeMirror editor. We
  // do not want to cause it to render mid-edit. Therefore it uses memo
  // and only renders on initial load. onChangeExpression must be stable.
  // const columnNameRef = useRef<string>(column.name);
  // const expressionRef = useRef(getCalculatedColumnDetails(column)[1]);

  const onChangeName = useCallback<FormEventHandler>(
    (evt) => {
      const { value } = evt.target as HTMLInputElement;
      const newColumn = setCalculatedColumnName(column, value);
      // columnNameRef.current = newColumn.name;
      setColumn(newColumn);
      onChangeNameProp?.(newColumn.name);
    },
    [column, onChangeNameProp, setColumn]
  );

  const onChangeExpression = useCallback(
    (value: string) => {
      // we do not set state when this changes as the codemirror editor
      // manages state of the expression for us until complete
      const expression = value.trim();
      // expressionRef.current = expression;
      // const [name, , type] = column.name.split(":");
      // columnNameRef.current = `${name}:${expression}:${type}`;

      const { current: column } = columnRef;
      const newColumn = setCalculatedColumnExpression(column, expression);
      setColumn(newColumn);

      onChangeNameProp?.(newColumn.name);

      // console.log(`calculatedColumnName ${columnNameRef.current}`);
    },
    [onChangeNameProp, setColumn]
  );

  const onChangeServerDataType = useCallback(
    (evt, value: string | null) => {
      if (isVuuColumnDataType(value)) {
        const newColumn = setCalculatedColumnType(column, value);
        setColumn(newColumn);
        onChangeNameProp?.(newColumn.name);
        onChangeServerDataTypeProp?.(value);
      }
    },
    [column, onChangeNameProp, onChangeServerDataTypeProp, setColumn]
  );

  return {
    column,
    onChangeExpression,
    onChangeName,
    onChangeServerDataType,
  };
};
