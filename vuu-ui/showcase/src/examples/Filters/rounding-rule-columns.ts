import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import { simulModule } from "@vuu-ui/vuu-data-test";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { getScaledDecimalScale, isTypeDescriptor } from "@vuu-ui/vuu-utils";
import "./UnderlyingValueCell";

/**
 * Scaled decimal columns that display fewer decimals than they hold are shown
 * twice, once rounded, once truncated. A filter takes its rounding rule from
 * the column, so each column filters by the rule with which it displays values.
 * The truncated column is a copy of the data, under another name, because a
 * Table cannot show the same column twice.
 */
const displaysFewerDecimals = (column: ColumnDescriptor) => {
  const scale = getScaledDecimalScale(column.serverDataType);
  const decimals = isTypeDescriptor(column.type)
    ? column.type.formatting?.decimals
    : undefined;
  return scale !== undefined && decimals !== undefined && decimals < scale;
};

const truncatedName = (name: string) => `${name}Truncated`;

/**
 * The column, rounded, and its truncated twin, if the column displays fewer
 * decimals than it holds. With renderer, values show the underlying value as
 * a tooltip.
 */
export const withRoundingRuleColumns = (
  columns: ColumnDescriptor[],
  { renderer = false } = {},
) =>
  columns.flatMap<ColumnDescriptor>((column) => {
    if (!displaysFewerDecimals(column) || !isTypeDescriptor(column.type)) {
      return [column];
    }
    const { formatting } = column.type;
    const type = renderer
      ? { ...column.type, renderer: { name: "example.underlying-value" } }
      : column.type;
    return [
      {
        ...column,
        label: `${column.label} (round)`,
        type: { ...type, formatting: { ...formatting, roundingRule: "round" } },
      },
      {
        ...column,
        label: `${column.label} (truncate)`,
        name: truncatedName(column.name),
        type: {
          ...type,
          formatting: { ...formatting, roundingRule: "truncate" },
        },
      },
    ];
  });

/**
 * A local data source over the instrumentsExtended data, with a truncated
 * twin (same values) of each of the given columns that displays fewer decimals
 * than it holds.
 */
export const createDataSourceWithTwins = (columns: ColumnDescriptor[]) => {
  const table = simulModule.tables.instrumentsExtended;
  const { columns: schemaColumns } = table.schema;
  const twins = columns.filter(displaysFewerDecimals).map(({ name }) => ({
    index: schemaColumns.findIndex((column) => column.name === name),
    column: {
      name: truncatedName(name),
      serverDataType: schemaColumns.find((column) => column.name === name)
        ?.serverDataType,
    },
  }));
  return new ArrayDataSource({
    columnDescriptors: [...schemaColumns, ...twins.map(({ column }) => column)],
    data: table.data.map((row) => [
      ...row,
      ...twins.map(({ index }) => row[index]),
    ]),
    keyColumn: table.schema.key,
  });
};
