import type { DataRow, RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { formatDate } from "@vuu-ui/vuu-utils";

export { isInlineEditingSession } from "@vuu-ui/vuu-utils2";

const timeFormatter = formatDate({ time: "hh:mm:ss" });
const dataRowEditErrors = Symbol("vuuDataRowEditErrors");

export const isEditRowReadOnly = (dataRow: DataRow) =>
  dataRow.vuu_action === "deleteRow";

type DataRowWithEditErrors = DataRow & {
  [dataRowEditErrors]?: Record<string, string>;
};

export const withDataRowEditErrors = <T extends DataRow>(
  dataRow: T,
  errors: Record<string, string>,
): T => {
  Object.defineProperty(dataRow, dataRowEditErrors, {
    configurable: true,
    value: errors,
  });
  return dataRow;
};

export const getVuuEditMessage = (
  dataRow: DataRow,
  column: RuntimeColumnDescriptor,
  originalValue: string,
) => {
  const editError = (dataRow as DataRowWithEditErrors)[dataRowEditErrors]?.[
    column.name
  ];
  if (editError) {
    return editError;
  }

  const vuuMsg = dataRow.vuuMsg as string;
  if (typeof vuuMsg === "string" && vuuMsg !== "") {
    const columnMessages = vuuMsg.split(",");
    const msgForCol = columnMessages.find((msg) =>
      msg.startsWith(`${column.name}:`),
    );
    if (msgForCol) {
      const [, value, updatedValue, ts] = msgForCol.split(":");
      const updateTime = timeFormatter(new Date(parseInt(ts as string)));
      return (
        <span>
          {"Update rejected. Original value "}
          <b>{originalValue}</b>
          {" could not be updated to "}
          <b>{value}</b>
          {". It was updated to "}
          <b>{updatedValue}</b>
          {" at "}
          {updateTime}
          {"."}
        </span>
      );
    }
  }
};
