import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { Table, TableEvents } from "./Table";
import { EventEmitter } from "@vuu-ui/vuu-utils";

type RowUpdates = {
  cellUpdates: Record<string, VuuRowDataItemType>;
  lastUpdateTimestamp?: number;
};

export type SessionTable = Table & {
  getSessionUpdates: () => Map<string, RowUpdates>;
};

// This doesn't really work because the session table is still connected to the base table data.
// This means edits applied at the end of an edit session are then posted to other active sessions.

// How can we ignore these ?
export const SessionTable = (table: Table, sessionId: string): SessionTable => {
  const updates = new Map<string, RowUpdates>();
  const eventEmitter = new EventEmitter<TableEvents>();

  const getSessionUpdates = () => {
    return updates;
  };

  // we need to intercept this as addEventListener accesses a private
  // member, so has to be invoked by table itself.
  const addEventListener = (event: string, handler: unknown) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    //table.on(event, handler);
    eventEmitter.on(event, handler);
  };

  const update = (
    key: string,
    columnName: string,
    value: VuuRowDataItemType,
  ) => {
    // we don't actually apply the update to the table, but we emit the updated event, so the bound
    // dataSource will update its own cache
    const row = table.findByKey(key);
    if (row) {
      const tsIndex = table.map.vuuUpdatedTimestamp;

      let updatesForRow = updates.get(key);
      if (updatesForRow === undefined) {
        updatesForRow = {
          lastUpdateTimestamp: row[tsIndex] as number | undefined,
          cellUpdates: {},
        };
        updates.set(key, updatesForRow);
      }
      updatesForRow.cellUpdates[columnName] = value;

      const newRow = row.slice();

      for (const [columnName, value] of Object.entries(
        updatesForRow.cellUpdates,
      )) {
        const colIndex = table.map[columnName];
        newRow[colIndex] = value;
      }

      eventEmitter.emit("update", newRow, columnName, sessionId);
    } else {
      console.warn(`SessionTable update row ${key} not found`);
    }
  };

  return new Proxy(table, {
    get(_obj, prop: string | symbol) {
      if (typeof prop === "symbol") {
        return undefined;
      }

      if (prop === "getSessionUpdates") {
        return getSessionUpdates;
      } else if (prop === "on" || prop === "addEventListener") {
        return addEventListener;
      } else if (prop === "update") {
        return update;
      }

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return table[prop];
    },

    set() {
      throw new TypeError("SessionTable is readonly");
    },
  }) as SessionTable;
};
