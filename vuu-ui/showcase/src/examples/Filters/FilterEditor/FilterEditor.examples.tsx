import { LocalDataSourceProvider, getSchema } from "@finos/vuu-data-test";
import type { SchemaColumn, TableSchema } from "@finos/vuu-data-types";
import type { Filter } from "@finos/vuu-filter-types";
import {
  FilterEditCancelHandler,
  FilterEditor,
  type FilterEditorProps,
  type FilterEditSaveHandler,
} from "@finos/vuu-filters";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { useCallback, useMemo } from "react";

const FilterEditorTemplate = ({
  onSave: onSaveProp,
  tableSchema = getSchema("instruments"),
  columnDescriptors = tableSchema.columns,
  ...props
}: Partial<FilterEditorProps>) => {
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
      tableSchema={tableSchema}
    />
  );
};

export const NewFilter = (props: Partial<FilterEditorProps>) => (
  <LocalDataSourceProvider modules={["SIMUL"]}>
    <FilterEditorTemplate {...props} />
  </LocalDataSourceProvider>
);

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
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <FilterEditorTemplate
        {...props}
        columnDescriptors={columnDescriptors}
        tableSchema={tableSchema}
      />
    </LocalDataSourceProvider>
  );
};

export const EditSimplerFilter = (props: Partial<FilterEditorProps>) => {
  const filter = useMemo<Filter>(() => {
    return {
      column: "currency",
      op: "=",
      value: "EUR",
    };
  }, []);

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <FilterEditorTemplate {...props} filter={filter} />
    </LocalDataSourceProvider>
  );
};

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

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <FilterEditorTemplate {...props} filter={filter} />
    </LocalDataSourceProvider>
  );
};

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

  return (
    <LocalDataSourceProvider modules={["SIMUL"]}>
      <FilterEditorTemplate {...props} filter={filter} />
    </LocalDataSourceProvider>
  );
};
