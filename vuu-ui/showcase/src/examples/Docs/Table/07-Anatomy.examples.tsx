import { Table } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";
import { stockColumns, useStockDataSource } from "./sample-data";

/**
 * The Table captured for the Anatomy page. Static data and a fixed size, so
 * that each capture is the same. Regenerate the capture with
 * `npm run showcase:anatomy` (see tools/vuu-showcase/scripts/anatomy).
 */
export const TableAnatomy = () => {
  const config = useMemo<TableConfig>(
    () => ({
      columns: stockColumns.slice(0, 6),
      rowSeparators: true,
      zebraStripes: true,
    }),
    [],
  );
  const dataSource = useStockDataSource();

  return (
    <Table
      autoSelectRowKey="NVDA.OQ"
      config={config}
      dataSource={dataSource}
      height={260}
      width={640}
    />
  );
};
