import type { SchemaColumn } from "@vuu-ui/vuu-data-types";
import type { RpcResult, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { Table } from "../../Table";
import type { ServiceHandler } from "./VuuModule";

export type EntityValues = Record<string, VuuRowDataItemType>;

export interface NextDayChangesProps {
  /**
   * The entity table. Besides its key and the entered columns it has
   * `active`, `change`, `changed_by` and the Vuu default columns.
   */
  table: Table;
  /** The columns the user enters, in display order. */
  columns: readonly SchemaColumn[];
  /** The entity's name, e.g. "limit": "New limit", "2 limits could not be saved". */
  entityName: string;
  /** The user who makes every change, written to changed_by. Default "". */
  user?: string;
  /** Rules for a whole entity, checked on save. Returns the first error. */
  validate: (values: EntityValues) => string | undefined;
  /** Values a new entity derives from the entered ones, e.g. defaults. */
  newValues?: (values: EntityValues) => EntityValues;
}

/** A pending change to an Active entity, applied on the next business day. */
type PendingChange =
  { type: "amend"; values: EntityValues } | { type: "delete" };

/** A session row that saving will add, amend or delete. */
interface SessionChange {
  action: "addRow" | "editCell" | "deleteRow";
  current: EntityValues | undefined;
  editChange: string;
  error: string | undefined;
  key: string;
  /** The key, or for an import the row's line in the file. */
  rowName: string;
  values: EntityValues;
}

const SUCCESS: RpcResult = {
  type: "SUCCESS_RESULT",
  data: undefined,
};

/** The values that differ from the current values. */
const changedValues = (current: EntityValues, values: EntityValues) =>
  Object.fromEntries(
    Object.entries(values).filter(
      ([column, value]) => current[column] !== value,
    ),
  );

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The changes to an entity table that take effect on the next business day:
 *
 * - saving a session never changes an Active entity. A new entity is not
 *   `active`. A change to, or deletion of, an Active entity is held and
 *   described in `change`; the entity stays `active`.
 * - at the start of the next business day, entities with a `change` take
 *   effect: new ones become `active`, held changes are applied and pending
 *   deletes are removed, see {@link activatePending}.
 *
 * A module creates one for each such table, gives its edit and import
 * blueprints the {@link endEditSession} service and calls
 * {@link describeEdits} from sessionTableChanged.
 */
export class NextDayChanges {
  /** Keys of the entities that have been Active, whose changes are held. */
  #activeKeys = new Set<string>();
  #pendingChanges = new Map<string, PendingChange>();
  #columns: readonly SchemaColumn[];
  #columnNames: readonly string[];
  #entityName: string;
  #newValues: (values: EntityValues) => EntityValues;
  #table: Table;
  #user: string;
  #validate: (values: EntityValues) => string | undefined;

  constructor({
    columns,
    entityName,
    newValues = () => ({}),
    table,
    user = "",
    validate,
  }: NextDayChangesProps) {
    this.#columns = columns;
    this.#columnNames = columns.map(({ name }) => name);
    this.#entityName = entityName;
    this.#newValues = newValues;
    this.#table = table;
    this.#user = user;
    this.#validate = validate;
  }

  get #keyColumn() {
    return this.#table.schema.key;
  }

  get #newChange() {
    return `New ${this.#entityName}`;
  }

  /** An endEditSession service that saves the session when asked to. */
  endEditSession(
    getSessionTable: (viewPortId: string) => Table,
  ): ServiceHandler {
    return async (rpcRequest) => {
      if ((rpcRequest.params as { save?: boolean }).save !== true) {
        return SUCCESS;
      }
      const { viewPortId } = rpcRequest.context as { viewPortId: string };
      return this.save(getSessionTable(viewPortId));
    };
  }

  /**
   * Saves the changes in a session table, as pending changes. Nothing is
   * saved unless every row is valid. A row that is not has its vuuMsg set,
   * and is named in the error, by its line for an import.
   */
  save(sessionTable: Table): RpcResult {
    const { map } = sessionTable;
    const keyColumn = this.#keyColumn;
    const columns = this.#columnNames.filter((name) => name in map);

    const changes = sessionTable.data.reduce<SessionChange[]>(
      (changes, sessionRow) => {
        const action = sessionRow[map.vuuAction];
        if (
          action !== "addRow" &&
          action !== "editCell" &&
          action !== "deleteRow"
        ) {
          return changes;
        }
        const key = String(sessionRow[map[keyColumn]]);
        const values: EntityValues = {};
        for (const name of columns) {
          values[name] = sessionRow[map[name]] as VuuRowDataItemType;
        }
        const editChange = String(sessionRow[map.editChange] ?? "");
        const current = this.#rowValues(key);
        const error =
          action === "deleteRow"
            ? undefined
            : this.#validate({ ...current, ...values });
        // vuuRowNum numbers the data rows of a CSV from 1, after the header
        const rowName =
          map.vuuRowNum === undefined
            ? key
            : `line ${Number(sessionRow[map.vuuRowNum]) + 1}`;
        changes.push({
          action,
          current,
          editChange,
          error,
          key,
          rowName,
          values,
        });
        return changes;
      },
      [],
    );

    const errors = changes.filter(({ error }) => error !== undefined);
    if (errors.length > 0) {
      for (const { error, key } of errors) {
        sessionTable.update(key, "vuuMsg", error as string);
      }
      const count =
        errors.length === 1
          ? `1 ${this.#entityName}`
          : `${errors.length} ${this.#entityName}s`;
      return {
        type: "ERROR_RESULT",
        errorMessage: `${count} could not be saved. ${errors
          .map(({ error, rowName }) => `${rowName}: ${error}`)
          .join(", ")}`,
      };
    }

    for (const { action, current, editChange, key, values } of changes) {
      if (action === "deleteRow") {
        this.#delete(key);
      } else if (current === undefined) {
        this.#insert(key, values);
      } else {
        this.#amend(key, current, values, editChange);
      }
    }
    return SUCCESS;
  }

  /** Sets editChange on each row to describe the change saving will make. */
  describeEdits(sessionTable: Table) {
    const { map } = sessionTable;
    if (map.editChange === undefined) return;
    const keyColumn = this.#keyColumn;
    const columns = this.#columnNames.filter((name) => name in map);
    for (const row of sessionTable.data) {
      const key = String(row[map[keyColumn]]);
      const values: EntityValues = {};
      for (const name of columns) {
        values[name] = row[map[name]] as VuuRowDataItemType;
      }
      const editChange = this.#describeEdit(
        key,
        row[map.vuuAction] as VuuRowDataItemType,
        values,
      );
      if (row[map.editChange] !== editChange) {
        sessionTable.update(key, "editChange", editChange);
      }
    }
  }

  /**
   * Simulates the start of the next business day: entities with a change
   * take effect. New ones become active, held changes are applied and
   * pending deletes remove their entity.
   */
  activatePending() {
    const { map } = this.#table;
    const pendingKeys = this.#table.data
      .filter((row) => row[map.change] !== "")
      .map((row) => String(row[map[this.#keyColumn]]));
    for (const key of pendingKeys) {
      const pending = this.#pendingChanges.get(key);
      this.#pendingChanges.delete(key);
      if (pending?.type === "delete") {
        this.#activeKeys.delete(key);
        this.#table.delete(key);
      } else {
        this.#activeKeys.add(key);
        this.#update(key, {
          ...(pending?.type === "amend" ? pending.values : {}),
          active: true,
          change: "",
        });
      }
    }
  }

  #rowValues(key: string) {
    const { map } = this.#table;
    const row = this.#table.findByKey(key);
    if (row === undefined) return undefined;
    const values: EntityValues = {};
    for (const { name } of this.#table.schema.columns) {
      values[name] = row[map[name]] as VuuRowDataItemType;
    }
    return values;
  }

  #update(key: string, values: EntityValues) {
    for (const [column, value] of Object.entries(values)) {
      this.#table.update(key, column, value);
    }
    this.#table.update(key, "vuuUpdatedTimestamp", Date.now());
  }

  #insert(key: string, values: EntityValues) {
    const now = Date.now();
    const row: EntityValues = {
      ...values,
      ...this.#newValues(values),
      [this.#keyColumn]: key,
      active: false,
      change: this.#newChange,
      changed_by: this.#user,
      vuuCreatedTimestamp: now,
      vuuMsg: "",
      vuuUpdatedTimestamp: now,
    };
    this.#table.insert(
      this.#table.schema.columns.map(({ name }) => row[name] ?? ""),
    );
  }

  #amend(
    key: string,
    current: EntityValues,
    values: EntityValues,
    editChange: string,
  ) {
    if (this.#activeKeys.has(key)) {
      const amended = this.#amendedValues(key, current, values);
      if (Object.keys(amended).length === 0) {
        this.#pendingChanges.delete(key);
        this.#update(key, { change: "", changed_by: "" });
      } else {
        this.#pendingChanges.set(key, { type: "amend", values: amended });
        this.#update(key, { change: editChange, changed_by: this.#user });
      }
    } else {
      // never Active, so the new entity itself is changed
      this.#update(key, {
        ...values,
        change: this.#newChange,
        changed_by: this.#user,
      });
    }
  }

  #delete(key: string) {
    if (this.#activeKeys.has(key)) {
      this.#pendingChanges.set(key, { type: "delete" });
      this.#update(key, { change: "Set to delete", changed_by: this.#user });
    } else {
      this.#table.delete(key);
    }
  }

  /**
   * The values of an Active entity once its held changes and the changes in
   * a session row are applied, where they differ from the Active values.
   */
  #amendedValues(key: string, current: EntityValues, values: EntityValues) {
    const held = this.#pendingChanges.get(key);
    return changedValues(current, {
      ...(held?.type === "amend" ? held.values : {}),
      ...changedValues(current, values),
    });
  }

  /**
   * Describes the change a session row will make, with the changes already
   * held: "New <entity>", "Set to delete", or each changed value.
   */
  #describeEdit(key: string, action: VuuRowDataItemType, values: EntityValues) {
    const current = this.#rowValues(key);
    if (action === "addRow" || current === undefined) {
      return this.#newChange;
    } else if (action === "deleteRow") {
      return "Set to delete";
    } else if (!this.#activeKeys.has(key)) {
      return this.#newChange;
    }
    const amended = this.#amendedValues(
      key,
      current,
      action === "editCell" ? values : {},
    );
    if (
      Object.keys(amended).length === 0 &&
      this.#pendingChanges.get(key)?.type === "delete"
    ) {
      return "Set to delete";
    }
    return this.#describeChanges(amended);
  }

  /** e.g. "soft changes to 120, hard changes to 150", in column order */
  #describeChanges(values: EntityValues) {
    return this.#columns
      .filter(({ name }) => name in values)
      .map(
        ({ name, serverDataType }) =>
          `${name} changes to ${formatValue(serverDataType, values[name])}`,
      )
      .join(", ");
  }
}

const formatValue = (serverDataType: string, value: VuuRowDataItemType) => {
  if (serverDataType === "epochtimestamp" && typeof value === "number") {
    const date = new Date(value);
    const month = pad(date.getMonth() + 1);
    return `${date.getFullYear()}-${month}-${pad(date.getDate())}`;
  }
  return String(value);
};
