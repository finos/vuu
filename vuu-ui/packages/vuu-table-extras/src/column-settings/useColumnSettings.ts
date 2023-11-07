import {
  ColumnDescriptor,
  TableConfig,
  ColumnTypeFormatting,
} from "@finos/vuu-datagrid-types";

import {
  CellRendererDescriptor,
  ColumnRenderPropsChangeHandler,
  getRegisteredCellRenderers,
  isValidColumnAlignment,
  isValidPinLocation,
  setCalculatedColumnName,
  updateColumnRenderProps,
  updateColumnType,
} from "@finos/vuu-utils";
import {
  FormEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ColumnSettingsProps } from "./ColumnSettingsPanel";

const integerCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type integer",
    label: "Default Renderer (int, long)",
    name: "default-int",
  },
  ...getRegisteredCellRenderers("int"),
];
const doubleCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type double",
    label: "Default Renderer (double)",
    name: "default-double",
  },
  ...getRegisteredCellRenderers("double"),
];

const stringCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type string",
    label: "Default Renderer (string)",
    name: "default-string",
  },
  ...getRegisteredCellRenderers("string"),
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

const getColumn = (columns: ColumnDescriptor[], column: ColumnDescriptor) => {
  if (column.name === "::") {
    // this is a new calculated column
    return column;
  } else {
    const col = columns.find((col) => col.name === column.name);
    if (col) {
      return col;
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
  column: columnProp,
  onCancelCreateColumn,
  onConfigChange,
  onCreateCalculatedColumn,
  tableConfig,
}: Omit<ColumnSettingsProps, "vuuTable">) => {
  const [column, setColumn] = useState<ColumnDescriptor>(
    getColumn(tableConfig.columns, columnProp)
  );
  const columnRef = useRef<ColumnDescriptor>(column);
  const [inEditMode, setEditMode] = useState(column.name === "::");

  const handleEditCalculatedcolumn = useCallback(() => {
    columnRef.current = column;
    setEditMode(true);
  }, [column]);

  useEffect(() => {
    setColumn(columnProp);
    setEditMode(columnProp.name === "::");
  }, [columnProp]);

  const availableRenderers = useMemo(() => {
    return getAvailableCellRenderers(column);
  }, [column]);

  const handleInputCommit = useCallback(() => {
    onConfigChange(replaceColumn(tableConfig, column));
  }, [column, onConfigChange, tableConfig]);

  const handleChange = useCallback<FormEventHandler>(
    (evt) => {
      const input = evt.target as HTMLInputElement;
      const fieldName = getFieldName(input);
      const { value } = input;
      switch (fieldName) {
        case "column-label":
          setColumn((state) => ({ ...state, label: value }));
          break;
        case "column-name":
          setColumn((state) => setCalculatedColumnName(state, value));
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

  const handleChangeCalculatedColumnName = useCallback((name: string) => {
    setColumn((state) => ({ ...state, name }));
  }, []);

  const handleChangeFormatting = useCallback(
    (formatting: ColumnTypeFormatting) => {
      const newColumn: ColumnDescriptor = updateColumnType(column, formatting);
      setColumn(newColumn);
      onConfigChange(replaceColumn(tableConfig, newColumn));
    },
    [column, onConfigChange, tableConfig]
  );

  const handleChangeRendering = useCallback<ColumnRenderPropsChangeHandler>(
    (renderProps) => {
      if (renderProps) {
        const newColumn: ColumnDescriptor = updateColumnRenderProps(
          column,
          renderProps
        );
        setColumn(newColumn);
        onConfigChange(replaceColumn(tableConfig, newColumn));
      }
    },
    [column, onConfigChange, tableConfig]
  );

  const navigateColumn = useCallback(
    ({ moveBy }: { moveBy: number }) => {
      const { columns } = tableConfig;
      const index = columns.indexOf(column) + moveBy;
      const newColumn = columns[index];
      if (newColumn) {
        setColumn(newColumn);
      }
    },
    [column, tableConfig]
  );
  const navigateNextColumn = useCallback(() => {
    navigateColumn({ moveBy: 1 });
  }, [navigateColumn]);

  const navigatePrevColumn = useCallback(() => {
    navigateColumn({ moveBy: -1 });
  }, [navigateColumn]);

  const handleSaveCalculatedColumn = useCallback(() => {
    // TODO validate expression, unique name
    onCreateCalculatedColumn(column);
  }, [column, onCreateCalculatedColumn]);

  const handleCancelEdit = useCallback(() => {
    if (columnProp.name === "::") {
      onCancelCreateColumn();
    } else {
      if (columnRef.current !== undefined && columnRef.current !== column) {
        setColumn(columnRef.current);
      }
      setEditMode(false);
    }
  }, [column, columnProp.name, onCancelCreateColumn]);

  return {
    availableRenderers,
    editCalculatedColumn: inEditMode,
    column,
    navigateNextColumn,
    navigatePrevColumn,
    onCancel: handleCancelEdit,
    onChange: handleChange,
    onChangeCalculatedColumnName: handleChangeCalculatedColumnName,
    onChangeFormatting: handleChangeFormatting,
    onChangeRendering: handleChangeRendering,
    onEditCalculatedColumn: handleEditCalculatedcolumn,
    onInputCommit: handleInputCommit,
    onSave: handleSaveCalculatedColumn,
  };
};
