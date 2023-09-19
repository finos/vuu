import {
  ColumnDescriptor,
  TableConfig,
  TypeFormatting,
} from "@finos/vuu-datagrid-types";

import {
  CellRendererDescriptor,
  getRegisteredCellRenderers,
  isColumnTypeRenderer,
  isTypeDescriptor,
  isValidColumnAlignment,
  isValidPinLocation,
  updateColumnRenderer,
  updateColumnType,
} from "@finos/vuu-utils";
import { SelectionChangeHandler } from "@finos/vuu-ui-controls";
import {
  FormEventHandler,
  KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { ColumnSettingsProps } from "./ColumnSettingsPanel";
import { ColumnDefinitionExpression } from "../column-expression-input";

const integerCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type integer",
    label: "Default Renderer (data type int, long)",
    name: "default-int",
  },
];
const doubleCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type double",
    label: "Default Renderer (data type double)",
    name: "default-double",
  },
  ...getRegisteredCellRenderers("double"),
];

const stringCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type string",
    label: "Default Renderer (data type string)",
    name: "default-string",
  },
];

const getAvailableCellRenderers = (
  column: ColumnDescriptor
): CellRendererDescriptor[] => {
  switch (column.serverDataType) {
    case "char":
    case "string":
      return stringCellRenderers;
    case "int":
    case "long":
      return integerCellRenderers;
    case "double":
      return doubleCellRenderers;
    default:
      return stringCellRenderers;
  }
};

const getCellRendererDescriptor = (
  availableRenderers: CellRendererDescriptor[],
  { type }: ColumnDescriptor
) => {
  if (isTypeDescriptor(type)) {
    const { renderer } = type;
    if (isColumnTypeRenderer(renderer)) {
      const cellRenderer = availableRenderers.find(
        (r) => r.name === renderer.name
      );
      if (cellRenderer) {
        return cellRenderer;
      }
    }
  }
  return availableRenderers[0];
};

const getFieldName = (input: HTMLInputElement): string => {
  const saltFormField = input.closest(".saltFormField") as HTMLElement;
  if (saltFormField && saltFormField.dataset.field) {
    const {
      dataset: { field },
    } = saltFormField;
    return field;
  } else {
    throw Error("named form field not found");
  }
};

const createCalculatedColumn = () =>
  ({
    label: "New calculated column",
    name: "",
    isCalculated: true,
  } as ColumnDescriptor);

const getColumn = (
  columns: ColumnDescriptor[],
  name: string,
  isNewCalculatedColumn = false
) => {
  if (isNewCalculatedColumn) {
    return createCalculatedColumn();
  } else {
    const column = columns.find((col) => col.name === name);
    if (column) {
      return column;
    }
    throw Error(`columns does not contain column ${name}`);
  }
};

const replaceColumn = (
  tableConfig: TableConfig,
  column: ColumnDescriptor
): TableConfig => ({
  ...tableConfig,
  columns: tableConfig.columns.map((col) =>
    col.name === column.name ? column : col
  ),
});

export const useColumnSettings = ({
  columnName,
  onConfigChange,
  onCreateCalculatedColumn,
  isNewCalculatedColumn,
  tableConfig,
}: Omit<ColumnSettingsProps, "vuuTable">) => {
  const sourceRef = useRef<string>("");

  const [column, setColumn] = useState<ColumnDescriptor>(
    getColumn(tableConfig.columns, columnName, isNewCalculatedColumn)
  );

  const availableRenderers = useMemo(() => {
    console.log(`get available cell renderers for `, {
      column,
    });
    return getAvailableCellRenderers(column);
  }, [column]);

  console.log({ availableRenderers });

  const [selectedRenderer, setSelectedRenderer] =
    useState<CellRendererDescriptor>(
      getCellRendererDescriptor(availableRenderers, column)
    );

  const handleInputKeyDown = useCallback(
    (evt: KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === "Enter" || evt.key === "Tab") {
        onConfigChange(replaceColumn(tableConfig, column));
      }
    },
    [column, onConfigChange, tableConfig]
  );

  const handleChange = useCallback<FormEventHandler>(
    (evt) => {
      const input = evt.target as HTMLInputElement;
      const fieldName = getFieldName(input);
      const { value } = input;
      switch (fieldName) {
        case "column-label":
          setColumn((state) => ({ ...state, label: value }));
          break;
        case "column-width":
          setColumn((state) => ({ ...state, width: parseInt(value) }));
          break;
        case "column-alignment":
          if (isValidColumnAlignment(value)) {
            const newColumn: ColumnDescriptor = {
              ...column,
              align: value || undefined,
            };
            setColumn(newColumn);
            onConfigChange(replaceColumn(tableConfig, newColumn));
          }
          break;
        case "column-pin":
          if (isValidPinLocation(value)) {
            const newColumn: ColumnDescriptor = {
              ...column,
              pin: value || undefined,
            };
            setColumn(newColumn);
            onConfigChange(replaceColumn(tableConfig, newColumn));

            break;
          }
      }
    },
    [column, onConfigChange, tableConfig]
  );

  const handleChangeRenderer = useCallback<
    SelectionChangeHandler<CellRendererDescriptor>
  >(
    (evt, cellRenderer) => {
      if (cellRenderer) {
        const newColumn: ColumnDescriptor = updateColumnRenderer(
          column,
          cellRenderer
        );
        setSelectedRenderer(cellRenderer);
        setColumn(newColumn);
        onConfigChange(replaceColumn(tableConfig, newColumn));
      }
    },
    [column, onConfigChange, tableConfig]
  );

  const handleChangeFormatting = useCallback(
    (formatting: TypeFormatting) => {
      const newColumn: ColumnDescriptor = updateColumnType(column, formatting);
      setColumn(newColumn);
      onConfigChange(replaceColumn(tableConfig, newColumn));
    },
    [column, onConfigChange, tableConfig]
  );

  const navigateColumn = useCallback(
    ({ moveBy }: { moveBy: number }) => {
      const { columns } = tableConfig;
      setColumn((column) => {
        const index = columns.indexOf(column) + moveBy;
        return columns[index] ?? column;
      });
    },
    [tableConfig]
  );
  const navigateNextColumn = useCallback(() => {
    navigateColumn({ moveBy: 1 });
  }, [navigateColumn]);

  const navigatePrevColumn = useCallback(() => {
    navigateColumn({ moveBy: -1 });
  }, [navigateColumn]);

  const handleChangeExpression = useCallback((source: string) => {
    sourceRef.current = source;
    console.log({ source });
  }, []);

  const handleSubmitExpression = useCallback(
    (source: string, expression: ColumnDefinitionExpression | undefined) => {
      console.log(`handleSubmitExpression`, { source, expression });
      // setExpression(expression);
    },
    []
  );

  const handleSave = useCallback(() => {
    if (sourceRef.current) {
      onCreateCalculatedColumn({
        name: "blah",
        expression: sourceRef.current,
      });
    }
  }, [onCreateCalculatedColumn]);

  return {
    availableRenderers,
    cellRenderer: selectedRenderer,
    column,
    navigateNextColumn,
    navigatePrevColumn,
    onChange: handleChange,
    onChangeExpression: handleChangeExpression,
    onChangeFormatting: handleChangeFormatting,
    onChangeRenderer: handleChangeRenderer,
    onKeyDown: handleInputKeyDown,
    onSave: handleSave,
    onSubmitExpression: handleSubmitExpression,
  };
};
