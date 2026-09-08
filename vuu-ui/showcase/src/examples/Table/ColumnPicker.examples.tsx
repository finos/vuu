import { ColumnPickerAction } from "@vuu-ui/vuu-table-extras";
import { SimulTable } from "./SimulTableTemplate";

/** tags=data-consumer */
export const InstrumentsWithColumnPicker = () => (
  <SimulTable
    tableFooterAction={(columnModel) => (
      <ColumnPickerAction columnModel={columnModel} />
    )}
    tableName="instruments"
  />
);
