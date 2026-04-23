import {
  ColumnDescriptor,
  TableConfig,
  ColumnTypeFormatting,
} from "@vuu-ui/vuu-table-types";

import {
  CellRendererDescriptor,
  ColumnRenderPropsChangeHandler,
  getFieldName,
  getRegisteredCellRenderers,
  isValidColumnAlignment,
  isValidPinLocation,
  setCalculatedColumnName,
  updateColumnRenderProps,
  updateColumnFormatting,
  updateColumnType,
  queryClosest,
  getServerDataType,
} from "@vuu-ui/vuu-utils";
import { VuuColumnDataType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import {
  FormEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { DataValueTypeSimple } from "@vuu-ui/vuu-data-types";
import { ColumnModel } from "../column-picker/ColumnModel";

/**
 * Describes the props for a Column Configuration Editor, for which
 * an implementation is provided in vuu-table-extras
 */
export interface ColumnSettingsProps {
  column: ColumnDescriptor;
  columnModel: ColumnModel;
  onConfigChange?: (config: TableConfig) => void;
  vuuTable?: VuuTable;
}

const integerCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type integer",
    label: "Default Renderer (int, long)",
    name: "default-int",
  },
];
const doubleCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type double",
    label: "Default Renderer (double)",
    name: "default-double",
  },
];
const decimalCellRenderers: CellRendererDescriptor[] = [
  {
    description:
      "Default formatter for columns with data type decimal (2,4,6 or 8)",
    label: "Default Renderer (decimal)",
    name: "default-decimal",
  },
];

const stringCellRenderers: CellRendererDescriptor[] = [
  {
    description: "Default formatter for columns with data type string",
    label: "Default Renderer (string)",
    name: "default-string",
  },
];

const booleanCellRenderers: CellRendererDescriptor[] = [];

const getAvailableCellRenderers = (
  column: ColumnDescriptor,
): CellRendererDescriptor[] => {
  const serverDataType = getServerDataType(column);
  switch (serverDataType) {
    case "char":
    case "string":
      return stringCellRenderers.concat(getRegisteredCellRenderers("string"));
    case "int":
    case "long":
      return integerCellRenderers.concat(getRegisteredCellRenderers("int"));
    case "double":
      return doubleCellRenderers.concat(
        getRegisteredCellRenderers(column.serverDataType),
      );
    case "scaleddecimal2":
    case "scaleddecimal4":
    case "scaleddecimal6":
    case "scaleddecimal8":
      return decimalCellRenderers.concat(
        getRegisteredCellRenderers(column.serverDataType),
      );
    case "boolean":
      return booleanCellRenderers.concat(getRegisteredCellRenderers("boolean"));
    default:
      return stringCellRenderers;
  }
};

export const useColumnSettings = ({
  column: columnProp,
  columnModel,
}: Omit<ColumnSettingsProps, "vuuTable">) => {
  const [column, setColumn] = useState<ColumnDescriptor>(
    columnModel.getColumn(columnProp.name),
  );

  useEffect(() => {
    setColumn(columnProp);
  }, [columnProp]);

  const availableRenderers = useMemo(() => {
    return getAvailableCellRenderers(column);
  }, [column]);

  const handleChangeToggleButton = useCallback<FormEventHandler>(
    (evt) => {
      const button = queryClosest<HTMLButtonElement>(evt.target, "button");
      if (button) {
        const fieldName = getFieldName(button);
        const { value } = button;
        switch (fieldName) {
          case "column-alignment":
            if (isValidColumnAlignment(value)) {
              const newColumn: ColumnDescriptor = {
                ...column,
                align: value,
              };
              setColumn(newColumn);
              columnModel.updateColumn(newColumn);
            }
            break;
          case "column-pin":
            if (isValidPinLocation(value)) {
              const newColumn: ColumnDescriptor = {
                ...column,
                pin: value || undefined,
              };
              setColumn(newColumn);
              columnModel.updateColumn(newColumn);

              break;
            }
        }
      }
    },
    [column, columnModel],
  );

  const handleChange = useCallback<FormEventHandler>((evt) => {
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
        {
          const numericValue = parseInt(value, 10);
          if (isNaN(numericValue)) {
            setColumn((state) => ({ ...state, width: undefined }));
          } else {
            setColumn((state) => ({ ...state, width: numericValue }));
          }
        }
        break;
    }
  }, []);

  const handleInputCommit = useCallback(() => {
    columnModel.updateColumn(column);
  }, [column, columnModel]);

  const handleChangeCalculatedColumnName = useCallback((name: string) => {
    setColumn((state) => ({ ...state, name }));
  }, []);

  const handleChangeRendering = useCallback<ColumnRenderPropsChangeHandler>(
    (renderProps) => {
      if (renderProps) {
        const newColumn: ColumnDescriptor = updateColumnRenderProps(
          column,
          renderProps,
        );
        setColumn(newColumn);
        columnModel.updateColumn(newColumn);
      }
    },
    [column, columnModel],
  );

  const handleChangeFormatting = useCallback(
    (formatting: ColumnTypeFormatting) => {
      const newColumn = updateColumnFormatting(column, formatting);
      setColumn(newColumn);
      columnModel.updateColumn(newColumn);
    },
    [column, columnModel],
  );

  const handleChangeType = useCallback(
    (type: DataValueTypeSimple) => {
      const updatedColumn = updateColumnType(column, type);
      setColumn(updatedColumn);
      columnModel.updateColumn(updatedColumn);
    },
    [column, columnModel],
  );

  // Changing the server data type applies only to calculated columns
  const handleChangeServerDataType = useCallback(
    (serverDataType: VuuColumnDataType) => {
      setColumn((col) => ({ ...col, serverDataType }));
    },
    [],
  );

  const navigateColumn = useCallback(
    ({ moveBy }: { moveBy: number }) => {
      const index = columnModel.selectedColumns.indexOf(column) + moveBy;
      const newColumn = columnModel.selectedColumns[index];
      if (newColumn) {
        setColumn(newColumn);
      }
    },
    [column, columnModel],
  );
  const navigateNextColumn = useCallback(() => {
    navigateColumn({ moveBy: 1 });
  }, [navigateColumn]);

  const navigatePrevColumn = useCallback(() => {
    navigateColumn({ moveBy: -1 });
  }, [navigateColumn]);

  return {
    availableRenderers,
    column,
    navigateNextColumn,
    navigatePrevColumn,
    onChange: handleChange,
    onChangeCalculatedColumnName: handleChangeCalculatedColumnName,
    onChangeFormatting: handleChangeFormatting,
    onChangeRendering: handleChangeRendering,
    onChangeServerDataType: handleChangeServerDataType,
    onChangeToggleButton: handleChangeToggleButton,
    onChangeType: handleChangeType,
    onInputCommit: handleInputCommit,
  };
};
