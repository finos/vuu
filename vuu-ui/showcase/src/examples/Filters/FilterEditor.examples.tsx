import { getSchema } from "@vuu-ui/vuu-data-test";
import type { SchemaColumn } from "@vuu-ui/vuu-data-types";
import type { Filter } from "@vuu-ui/vuu-filter-types";
import {
  FilterEditCancelHandler,
  FilterEditor,
  type FilterEditorProps,
  type FilterEditSaveHandler,
} from "@vuu-ui/vuu-filters";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { DataSourceProvider, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";

const instrumentsSchema = getSchema("instruments");

const FilterEditorTemplate = ({
  onSave: onSaveProp,
  columnDescriptors = instrumentsSchema.columns,
  ...props
}: Partial<FilterEditorProps>) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema("instruments");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

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
    <DataSourceProvider dataSource={dataSource}>
      <FilterEditor
        {...props}
        columnDescriptors={columnDescriptors}
        onCancel={onCancel}
        onSave={onSave}
        style={style}
        vuuTable={instrumentsSchema.table}
      />
    </DataSourceProvider>
  );
};

/** tags=data-consumer */
export const NewFilter = (props: Partial<FilterEditorProps>) => (
  <FilterEditorTemplate {...props} />
);

/** tags=data-consumer */
export const NewFilterDateColumns = (props: Partial<FilterEditorProps>) => {
  const columnDescriptors = useMemo<ColumnDescriptor[]>(() => {
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

    return columns.map<ColumnDescriptor>((col) => ({
      ...col,
      type: "date/time",
    }));
  }, []);

  return (
    <FilterEditorTemplate
      {...props}
      columnDescriptors={columnDescriptors}
      vuuTable={instrumentsSchema.table}
    />
  );
};

/** tags=data-consumer */
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

/** tags=data-consumer */
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

/** tags=data-consumer */
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
