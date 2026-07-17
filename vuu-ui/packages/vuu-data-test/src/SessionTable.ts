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

const isProxy = Symbol("proxy-session-table");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isProxySessionTable = (table: any): table is SessionTable =>
  table[isProxy];

// This doesn't really work because the session table is still connected to the base table data.
// This means edits applied at the end of an edit session are then posted to other active sessions.

// How can we ignore these ?
export const SessionTable = (table: Table, sessionId: string): SessionTable => {
  const updates = new Map<string, RowUpdates>();
  /** Rows added in this session. */
  const insertedRows = new Map<string, VuuRowDataItemType[]>();
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
    const sourceRow = table.findByKey(key);
    const insertedRow = sourceRow ? undefined : insertedRows.get(key);
    const row = sourceRow ?? insertedRow;
    if (row) {
      const tsIndex = table.map.vuuUpdatedTimestamp;

      // Only source rows go into `updates`; inserted rows are edited in-memory.
      if (sourceRow) {
        let updatesForRow = updates.get(key);
        if (updatesForRow === undefined) {
          updatesForRow = {
            lastUpdateTimestamp: row[tsIndex] as number | undefined,
            cellUpdates: {},
          };
          updates.set(key, updatesForRow);
        }
        updatesForRow.cellUpdates[columnName] = value;
      } else if (insertedRow) {
        const colIdx = table.map[columnName];
        if (colIdx !== undefined) {
          insertedRow[colIdx] = value;
        }
      }

      const newRow = row.slice();

      for (const [columnName, value] of Object.entries(
        sourceRow ? (updates.get(key)?.cellUpdates ?? {}) : {},
      )) {
        const colIndex = table.map[columnName];
        newRow[colIndex] = value;
      }
      if (insertedRow) {
        const colIdx = table.map[columnName];
        if (colIdx !== undefined) {
          newRow[colIdx] = value;
        }
      }

      eventEmitter.emit("update", newRow, columnName, sessionId);
    } else {
      console.warn(`SessionTable update row ${key} not found`);
    }
  };

  const insert = (row: VuuRowDataItemType[]) => {
    // Keep inserted rows by key for later updates.
    const keyIdx = table.map[table.schema.key];
    if (keyIdx !== undefined) {
      insertedRows.set(`${row[keyIdx]}`, [...row]);
    }
    eventEmitter.emit("insert", row);
  };

  const deleteRow = (key: string) => {
    eventEmitter.emit("delete", key);
  };

  return new Proxy(table, {
    get(_obj, prop: string | symbol) {
      if (typeof prop === "symbol") {
        if (prop === isProxy) {
          return true;
        }
        return undefined;
      }

      if (prop === "getSessionUpdates") {
        return getSessionUpdates;
      } else if (prop === "on" || prop === "addEventListener") {
        return addEventListener;
      } else if (prop === "update") {
        return update;
      } else if (prop === "insert") {
        return insert;
      } else if (prop === "delete") {
        return deleteRow;
      } else if (prop === "isProxy") {
        return true;
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
