import { getSchema } from "@vuu-ui/vuu-data-test";
import { TableSchemaTable } from "@vuu-ui/vuu-data-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { VuuTypeaheadInput } from "@vuu-ui/vuu-ui-controls";
import {
  CommitHandler,
  DataSourceProvider,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
import { CSSProperties, useMemo } from "react";

const TypeaheadInputTemplate = ({
  allowFreeInput,
  column = { name: "currency", serverDataType: "string" },
  onCommit,
  table = { module: "SIMUL", table: "instrumentsExtended" },
}: {
  allowFreeInput?: boolean;
  column?: ColumnDescriptor;
  onCommit?: CommitHandler;
  style?: CSSProperties;
  table?: TableSchemaTable;
}) => {
  const handleCommit: CommitHandler = (evt, value) => {
    onCommit?.(evt, value);
    console.log(`commit ${value}`);
  };

  return (
    <VuuTypeaheadInput
      allowFreeInput={allowFreeInput}
      column={column.name}
      onCommit={handleCommit}
      table={table}
    />
  );
};

/** tags=data-consumer */
export const CurrencyWithTypeaheadAllowFreeText = ({
  onCommit,
}: {
  onCommit?: CommitHandler;
}) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema("instruments");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        padding: "0 3px",
        width: 200,
        height: 32,
        border: "solid 1px lightgray",
      }}
    >
      <DataSourceProvider dataSource={dataSource}>
        <TypeaheadInputTemplate onCommit={onCommit} />
      </DataSourceProvider>
    </div>
  );
};

/** tags=data-consumer */
export const CurrencyWithTypeaheadDisallowFreeText = ({
  onCommit,
}: {
  onCommit?: CommitHandler;
}) => {
  const { VuuDataSource } = useData();
  const dataSource = useMemo(() => {
    const schema = getSchema("instruments");
    return new VuuDataSource({
      columns: schema.columns.map(toColumnName),
      table: schema.table,
    });
  }, [VuuDataSource]);

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        padding: "0 3px",
        width: 200,
        height: 32,
        border: "solid 1px lightgray",
      }}
    >
      <DataSourceProvider dataSource={dataSource}>
        <TypeaheadInputTemplate allowFreeInput={false} onCommit={onCommit} />
      </DataSourceProvider>
    </div>
  );
};

export const CurrencyNoTypeaheadAllowFreeText = () => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        padding: "0 3px",
        width: 200,
        height: 32,
        border: "solid 1px lightgray",
      }}
    >
      <TypeaheadInputTemplate />
    </div>
  );
};

export const CurrencyNoTypeaheadDisallowFreeText = () => {
  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        padding: "0 3px",
        width: 200,
        height: 32,
        border: "solid 1px lightgray",
      }}
    >
      <TypeaheadInputTemplate allowFreeInput={false} />
    </div>
  );
};
