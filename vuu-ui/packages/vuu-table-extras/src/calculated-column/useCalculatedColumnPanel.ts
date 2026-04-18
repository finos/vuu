import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  getCalculatedColumnDetails,
  isVuuColumnDataType,
  setCalculatedColumnExpression,
  setCalculatedColumnName,
  setCalculatedColumnType,
} from "@vuu-ui/vuu-utils";
import {
  FormEventHandler,
  SyntheticEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { CalculatedColumnPanelProps } from "./CalculatedColumnPanel";

export type ColumnExpressionHookProps = Pick<
  CalculatedColumnPanelProps,
  "column" | "onChangeColumn" | "onChangeServerDataType"
>;

const applyDefaults = (column: ColumnDescriptor) => {
  const { name, expression, serverDataType } =
    getCalculatedColumnDetails(column);
  if (serverDataType === undefined) {
    return {
      ...column,
      name: `${name}:string:${expression}`,
    };
  } else {
    return column;
  }
};

export const useCalculatedColumnPanel = ({
  column: columnProp,
  onChangeColumn,
  onChangeServerDataType: onChangeServerDataTypeProp,
}: ColumnExpressionHookProps) => {
  const [column, _setColumn] = useState<ColumnDescriptor>(
    applyDefaults(columnProp),
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
      console.log(`name = ${newColumn.name}`);
      setColumn(newColumn);
      onChangeColumn(newColumn);
    },
    [column, onChangeColumn, setColumn],
  );

  const onChangeExpression = useCallback(
    (value: string) => {
      console.log(`expression = ${value}`);
      // we do not set state when this changes as the codemirror editor
      // manages state of the expression for us until complete
      const expression = value.trim();
      // expressionRef.current = expression;
      // const [name, , type] = column.name.split(":");
      // columnNameRef.current = `${name}:${expression}:${type}`;

      const { current: column } = columnRef;
      const newColumn = setCalculatedColumnExpression(column, expression);
      setColumn(newColumn);

      onChangeColumn(newColumn);
    },
    [onChangeColumn, setColumn],
  );

  const onChangeServerDataType = useCallback(
    (_e: SyntheticEvent, [serverDataType]: string[]) => {
      if (isVuuColumnDataType(serverDataType)) {
        const newColumn = setCalculatedColumnType(column, serverDataType);
        setColumn(newColumn);
        onChangeServerDataTypeProp?.(serverDataType);
        onChangeColumn(newColumn);
      }
    },
    [column, onChangeColumn, onChangeServerDataTypeProp, setColumn],
  );

  return {
    column,
    onChangeExpression,
    onChangeName,
    onChangeServerDataType,
  };
};
