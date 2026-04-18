import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { useModal } from "@vuu-ui/vuu-ui-controls";
import { useCallback, useRef } from "react";
import { ColumnModel } from "../column-picker/ColumnModel";
import { CalculatedColumnPanel } from "./CalculatedColumnPanel";

type CalculatedColumnState = {
  originalColumn?: ColumnDescriptor;
  newColumn: ColumnDescriptor;
};

export interface EditCalculatedColumnProps {
  calculatedColumn?: ColumnDescriptor;
  columnModel: ColumnModel;
  onSaveColumn?: (caclulatedColumn: ColumnDescriptor) => void;
  vuuTable?: VuuTable;
}

export const useEditCalculatedColumn = ({
  calculatedColumn,
  columnModel,
  onSaveColumn,
  vuuTable,
}: EditCalculatedColumnProps) => {
  if (vuuTable === undefined) {
    throw Error(
      `[useEditCalculatedColumn] vuuTable must be provided to create or edit a calculated column`,
    );
  }
  const { showPrompt } = useModal();

  const calculatedColumnRef = useRef<CalculatedColumnState | undefined>(
    undefined,
  );

  const handleChangeNewCalculatedColumn = useCallback(
    (column: ColumnDescriptor) => {
      if (calculatedColumnRef.current) {
        calculatedColumnRef.current.newColumn = column;
      } else {
        throw Error(`[TabbedTableConfigPanel] handleChangeNewCalculatedColumn`);
      }
    },
    [],
  );

  const handleSaveNewCalculatedColumn = useCallback(() => {
    if (calculatedColumnRef.current) {
      const {
        current: { newColumn: calculatedColumn },
      } = calculatedColumnRef;
      columnModel.addColumn(calculatedColumn, true);
      calculatedColumnRef.current = undefined;
      onSaveColumn?.(calculatedColumn);
    }
    const { current: calculatedColumn } = calculatedColumnRef;
    if (calculatedColumn) {
      columnModel.addColumn(calculatedColumn, true);
      calculatedColumnRef.current = undefined;
      onSaveColumn?.(calculatedColumn);
    }
  }, [columnModel, onSaveColumn]);

  const handleCreateCalculatedColumn = useCallback(() => {
    if (vuuTable) {
      const newColumn: ColumnDescriptor = {
        name: "::",
        serverDataType: "string",
      };
      calculatedColumnRef.current = { newColumn };
      // TODO load this dynamically
      showPrompt(
        <CalculatedColumnPanel
          column={newColumn}
          columnModel={columnModel}
          onChangeColumn={handleChangeNewCalculatedColumn}
          vuuTable={vuuTable}
        />,
        {
          confirmButtonLabel: "Save column",
          onConfirm: handleSaveNewCalculatedColumn,
          title: "Calculated column",
        },
      );
    }
  }, [
    columnModel,
    handleChangeNewCalculatedColumn,
    handleSaveNewCalculatedColumn,
    showPrompt,
    vuuTable,
  ]);

  const handleSaveColumnEdits = useCallback(() => {
    if (calculatedColumnRef.current) {
      const { originalColumn, newColumn } = calculatedColumnRef.current;
      if (originalColumn) {
        calculatedColumnRef.current = undefined;
        onSaveColumn?.(newColumn);

        columnModel.updateColumn(originalColumn, newColumn);
      }
    }
  }, [columnModel, onSaveColumn]);

  const handleUpdateCalculatedColumn = useCallback(
    (column: ColumnDescriptor) => {
      if (calculatedColumnRef.current) {
        calculatedColumnRef.current.newColumn = column;
      } else {
        throw Error("[TabbedTableConfigPanel] handleUpdateCalculatedColumn`");
      }
    },
    [],
  );

  const handleEditCalculatedColumn = useCallback(() => {
    if (calculatedColumn && vuuTable) {
      calculatedColumnRef.current = {
        originalColumn: calculatedColumn,
        newColumn: calculatedColumn,
      };
      // TODO load this dynamically
      showPrompt(
        <CalculatedColumnPanel
          column={calculatedColumn}
          columnModel={columnModel}
          onChangeColumn={handleUpdateCalculatedColumn}
          vuuTable={vuuTable}
        />,
        {
          confirmButtonLabel: "Save column",
          onConfirm: handleSaveColumnEdits,
          title: "Calculated column",
        },
      );
    }
  }, [
    calculatedColumn,
    columnModel,
    handleSaveColumnEdits,
    handleUpdateCalculatedColumn,
    showPrompt,
    vuuTable,
  ]);

  return {
    onCreateCalculatedColumn: handleCreateCalculatedColumn,
    onEditCalculatedColumn: handleEditCalculatedColumn,
  };
};
