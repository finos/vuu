import { FlexboxLayout } from "@vuu-ui/vuu-layout";
import { getSchema, vuuModule } from "@vuu-ui/vuu-data-test";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { Table } from "@vuu-ui/vuu-table";
import { useMemo } from "react";

export const TableWithFooter = () => {
  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: getSchema("instruments").columns,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, []);
  const dataSource = useMemo(() => {
    return vuuModule("SIMUL").createDataSource("instruments");
  }, []);

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
