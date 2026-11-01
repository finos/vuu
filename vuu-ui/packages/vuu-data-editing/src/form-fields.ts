import type {
  DataValueDescriptor,
  SchemaColumn,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { isDataValueEditable } from "@vuu-ui/vuu-utils";
import {
  DEFAULT_READ_ONLY_COLUMNS,
  narrowEditable,
} from "./useEditableColumns";

export interface FormFieldsOptions {
  /**
   * Table columns, e.g. `config.columns`. Their `label`, `editor`, `type`
   * and `editable` carry over to the fields, and they come first, in this
   * order.
   */
  columns?: readonly DataValueDescriptor[];
  /**
   * Choose the fields, in order, rather than generating one per schema
   * column. Each is still overlaid on its schema column (and table column).
   */
  fields?: readonly DataValueDescriptor[];
  /**
   * `insert` for a create form: fields that can't be set on a new row are
   * left out. @default "update"
   */
  operation?: "insert" | "update";
  /** The server schema, usually `dataSource.tableSchema`. */
  schema?: TableSchema;
}

const isServerMaintained = (name: string) =>
  (DEFAULT_READ_ONLY_COLUMNS as readonly string[]).includes(name);

const toDescriptor = (
  name: string,
  schemaColumn: SchemaColumn | undefined,
  ...overlays: (DataValueDescriptor | undefined)[]
): DataValueDescriptor => {
  const descriptor: DataValueDescriptor = {
    name,
    serverDataType: schemaColumn?.serverDataType,
  };
  let editable = schemaColumn?.editable;
  for (const overlay of overlays) {
    if (overlay) {
      const { label, editor, required, serverDataType, type } = overlay;
      if (label !== undefined) descriptor.label = label;
      if (editor !== undefined) descriptor.editor = editor;
      if (required !== undefined) descriptor.required = required;
      if (type !== undefined) descriptor.type = type;
      if (serverDataType !== undefined && schemaColumn === undefined) {
        descriptor.serverDataType = serverDataType;
      }
      editable = narrowEditable(editable, overlay.editable);
    }
  }
  if (descriptor.required === undefined && schemaColumn?.required) {
    descriptor.required = true;
  }
  if (editable !== undefined) {
    descriptor.editable = editable;
  }
  return descriptor;
};

/**
 * The fields of a generated form: one per schema column, except the
 * server-maintained `vuuCreatedTimestamp`, `vuuUpdatedTimestamp` and
 * `vuuMsg`. Columns also in `columns` come first, in that order, then the
 * rest in schema order. Each field is the schema column overlaid with the
 * matching table column, so a column's `label`, `editor` and `type` carry
 * over, and its `editable` can narrow, never widen, the server's.
 *
 * Without a schema, the fields are generated from `columns`.
 */
export const getFormFields = ({
  columns = [],
  fields,
  operation = "update",
  schema,
}: FormFieldsOptions): DataValueDescriptor[] => {
  const schemaColumns = new Map(
    schema?.columns.map((column) => [column.name, column]),
  );
  const tableColumns = new Map(columns.map((column) => [column.name, column]));

  let descriptors: DataValueDescriptor[];
  if (fields) {
    descriptors = fields.map((field) =>
      toDescriptor(
        field.name,
        schemaColumns.get(field.name),
        tableColumns.get(field.name),
        field,
      ),
    );
  } else {
    const names = schema
      ? columns
          .map(({ name }) => name)
          .filter((name) => schemaColumns.has(name))
          .concat(
            schema.columns
              .map(({ name }) => name)
              .filter((name) => !tableColumns.has(name)),
          )
      : columns.map(({ name }) => name);
    descriptors = names
      .filter((name) => !isServerMaintained(name))
      .map((name) =>
        toDescriptor(name, schemaColumns.get(name), tableColumns.get(name)),
      );
  }

  return operation === "insert"
    ? descriptors.filter((descriptor) =>
        isDataValueEditable(descriptor, "insert", true),
      )
    : descriptors;
};
