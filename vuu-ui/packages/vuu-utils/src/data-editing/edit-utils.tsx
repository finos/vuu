import { EditSessionMode, EditSessionModeAlias, InlineEditSessionMode, StandaloneEditSessionMode } from "@vuu-ui/vuu-data-types";
import { DataRow, RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { formatDate } from "../date";

/**
 * Converts a StandaloneEditSessionMode long-form value to the short-form alias
 * accepted by the beginEditSession RPC.
 * `"inline-all-rows"` is NOT converted here — it is a client-only flag that
 * passes through to the RPC unchanged.
 */
const TO_RPC_MODE: Partial<Record<string, EditSessionModeAlias>> = {
  "all-rows": "All",
  "empty-session-table": "Empty",
  "selected-rows": "Selected",
};

export const toRpcEditSessionMode = (
  mode: EditSessionMode,
): EditSessionModeAlias =>
  TO_RPC_MODE[mode] ?? (mode as EditSessionModeAlias);

/**
 * Converts an RPC alias back to the long-form mode needed by VuuModule
 * internals (e.g. `createSessionTable`). Always returns a long-form value.
 */
const FROM_RPC_MODE: Record<EditSessionModeAlias, InlineEditSessionMode | StandaloneEditSessionMode> = {
  All: "all-rows",
  Empty: "empty-session-table",
  Selected: "selected-rows",
};

export const fromRpcEditSessionMode = (
  alias: EditSessionModeAlias,
): InlineEditSessionMode | StandaloneEditSessionMode =>
  FROM_RPC_MODE[alias] ?? (alias as StandaloneEditSessionMode);

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
