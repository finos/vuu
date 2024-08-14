import {
  FilterEditCancelHandler,
  FilterEditor,
  FilterEditorProps,
  FilterEditSaveHandler,
} from "@finos/vuu-filters";
import { useCallback, useMemo } from "react";
import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { Filter } from "@finos/vuu-filter-types";
import { SchemaColumn, TableSchema } from "packages/vuu-data-types";
import { ColumnDescriptor } from "packages/vuu-table-types";

let displaySequence = 1;

const FilterEditorTemplate = ({
  onSave: onSaveProp,
  tableSchema = getSchema("instruments"),
  columnDescriptors = tableSchema.columns,
  ...props
}: Partial<FilterEditorProps>) => {
  const { typeaheadHook } = vuuModule("SIMUL");

  const onCancel = useCallback<FilterEditCancelHandler>(() => {
    console.log(`cancel  filter edit`);
  }, []);

  const onSave = useMemo<FilterEditSaveHandler>(
    () =>
      onSaveProp ??
      ((filter) => {
        console.log(`save filter ${JSON.stringify(filter)}`);
      }),
    [onSaveProp],
  );

  const style = useMemo(
    () => ({
      background: "#eee",
    }),
    [],
  );

  return (
    <FilterEditor
      {...props}
      columnDescriptors={columnDescriptors}
      onCancel={onCancel}
      onSave={onSave}
      style={style}
      suggestionProvider={typeaheadHook}
      tableSchema={tableSchema}
    />
  );
};

export const NewFilter = (props: Partial<FilterEditorProps>) => (
  <FilterEditorTemplate {...props} />
);

NewFilter.displaySequence = displaySequence++;

export const NewFilterDateColumns = (props: Partial<FilterEditorProps>) => {
  const [tableSchema, columnDescriptors] = useMemo<
    [TableSchema, ColumnDescriptor[]]
  >(() => {
    const columns: SchemaColumn[] = [
      {
        name: "tradeDate",
        serverDataType: "long",
      },
      {
        name: "settlementDate",
        serverDataType: "long",
      },
    ];

    return [
      {
        columns,
        key: "id",
        table: { table: "Test", module: "test" },
      },

      columns.map<ColumnDescriptor>((col) => ({ ...col, type: "date/time" })),
    ];
  }, []);

  return (
    <FilterEditorTemplate
      {...props}
      columnDescriptors={columnDescriptors}
      tableSchema={tableSchema}
    />
  );
};

NewFilterDateColumns.displaySequence = displaySequence++;

export const EditSimplerFilter = (props: Partial<FilterEditorProps>) => {
  const filter = useMemo<Filter>(() => {
    return {
      column: "currency",
      op: "=",
      value: "EUR",
    };
  }, []);

  return <FilterEditorTemplate {...props} filter={filter} />;
};
EditSimplerFilter.displaySequence = displaySequence++;

export const EditMultiClauseAndFilter = (props: Partial<FilterEditorProps>) => {
  const filter = useMemo<Filter>(() => {
    return {
      op: "and",
      filters: [
        {
          column: "currency",
          op: "=",
          value: "EUR",
        },
        {
          column: "exchange",
          op: "=",
          value: "XLON",
        },
      ],
    };
  }, []);

  return <FilterEditorTemplate {...props} filter={filter} />;
};
EditMultiClauseAndFilter.displaySequence = displaySequence++;

export const EditMultiClauseOrFilter = (props: Partial<FilterEditorProps>) => {
  const filter = useMemo<Filter>(() => {
    return {
      op: "or",
      filters: [
        {
          column: "currency",
          op: "=",
          value: "EUR",
        },
        {
          column: "exchange",
          op: "=",
          value: "XLON/LSE-SETS",
        },
      ],
    };
  }, []);

  return <FilterEditorTemplate {...props} filter={filter} />;
};
EditMultiClauseOrFilter.displaySequence = displaySequence++;
