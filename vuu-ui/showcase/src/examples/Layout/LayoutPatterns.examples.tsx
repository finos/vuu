import { FlexboxLayout } from "@vuu-ui/vuu-layout";
import { getSchema } from "@vuu-ui/vuu-data-test";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { Table } from "@vuu-ui/vuu-table";
import { useMemo } from "react";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";

const tableSchema = getSchema("instruments");

/** tags=data-consumer */
export const TableWithFooter = () => {
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: tableSchema.columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);
  const { VuuDataSource } = useData();
  const dataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: tableSchema.columns.map(toColumnName),
        table: tableSchema.table,
      }),
    [VuuDataSource],
  );

  return (
    <FlexboxLayout
      style={{ flexDirection: "column", height: "100%", width: "100%" }}
    >
      <Table
        config={tableConfig}
        dataSource={dataSource}
        renderBufferSize={0}
      />
    </FlexboxLayout>
  );
};
