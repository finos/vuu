import { EditSessionMode, InlineEditSessionMode } from "@vuu-ui/vuu-data-types";
import { DataRow, RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { formatDate } from "../date";

export const isInlineEditingSession = (
  editSessionMode: EditSessionMode,
): editSessionMode is InlineEditSessionMode =>
  editSessionMode.startsWith("inline");

const timeFormatter = formatDate({ time: "hh:mm:ss" });

export const getVuuEditMessage = (
  dataRow: DataRow,
  column: RuntimeColumnDescriptor,
  originalValue: string,
) => {
  const vuuMsg = dataRow.vuuMsg as string;
  if (vuuMsg) {
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
