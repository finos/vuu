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
  setCalculatedColumnName,
  updateColumnRenderer,
  updateColumnType,
} from "@finos/vuu-utils";
import { SingleSelectionHandler } from "@finos/vuu-ui-controls";
import {
  FormEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { ColumnSettingsProps } from "./ColumnSettingsPanel";

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
  column: ColumnDescriptor
) => {
  if (isTypeDescriptor(column.type)) {
    const { renderer } = column.type;
    if (isColumnTypeRenderer(renderer)) {
      const cellRenderer = availableRenderers.find(
        (r) => r.name === renderer.name
      );
      if (cellRenderer) {
        return cellRenderer;
      }
    }
  }
  // retur the appropriate default value for the column
  const typedAvailableRenderers = getAvailableCellRenderers(column);
  return typedAvailableRenderers[0];
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
  onConfigChange,
  onCreateCalculatedColumn,
  tableConfig,
}: Omit<ColumnSettingsProps, "vuuTable">) => {
  const [column, setColumn] = useState<ColumnDescriptor>(
    getColumn(tableConfig.columns, columnProp)
  );

  const availableRenderers = useMemo(() => {
    return getAvailableCellRenderers(column);
  }, [column]);

  const selectedCellRendererRef = useRef<CellRendererDescriptor | undefined>(
    getCellRendererDescriptor(availableRenderers, column)
  );

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

  const handleChangeRenderer = useCallback<
    SingleSelectionHandler<CellRendererDescriptor>
  >(
    (evt, cellRenderer) => {
      if (cellRenderer) {
        const newColumn: ColumnDescriptor = updateColumnRenderer(
          column,
          cellRenderer
        );
        selectedCellRendererRef.current = cellRenderer;
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
      const index = columns.indexOf(column) + moveBy;
      const newColumn = columns[index];
      if (newColumn) {
        selectedCellRendererRef.current = getCellRendererDescriptor(
          availableRenderers,
          newColumn
        );
        setColumn(newColumn);
      }
    },
    [availableRenderers, column, tableConfig]
  );
  const navigateNextColumn = useCallback(() => {
    navigateColumn({ moveBy: 1 });
  }, [navigateColumn]);

  const navigatePrevColumn = useCallback(() => {
    navigateColumn({ moveBy: -1 });
  }, [navigateColumn]);

  const handleSaveCalculatedColumn = useCallback(
    (calculatedColumn: ColumnDescriptor) => {
      // TODO validate expression, unique name
      onCreateCalculatedColumn({
        ...column,
        ...calculatedColumn,
      });
    },
    [column, onCreateCalculatedColumn]
  );

  return {
    availableRenderers,
    selectedCellRenderer: selectedCellRendererRef.current,
    column,
    navigateNextColumn,
    navigatePrevColumn,
    onChange: handleChange,
    onChangeFormatting: handleChangeFormatting,
    onChangeRenderer: handleChangeRenderer,
    onInputCommit: handleInputCommit,
    onSave: handleSaveCalculatedColumn,
  };
};
