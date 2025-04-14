import { getSchema, vuuModule } from "@finos/vuu-data-test";
import { FlexboxLayout, LayoutProvider, View } from "@finos/vuu-layout";
import { TableColumnDef, TanstackTable } from "@finos/vuu-tanstack-table";
import { toColumnName, useDataSource } from "@finos/vuu-utils";
import { useMemo } from "react";

import "./index.css";
import { access } from "fs";

export type DataRowAtIndexFunc<T = unknown> = (index: number) => T[];
const instrumentsSchema = getSchema("instruments");
const dataSourceProps = {
  columns: instrumentsSchema.columns.map(toColumnName),
  table: instrumentsSchema.table,
};

type Instrument = {
  bbg: string;
  currency: string;
  description: string;
  exchange: string;
  isin: string;
  lotsize: number;
  ric: string;
};

const instrumentColumns: Array<TableColumnDef<Instrument>> = [
  {
    accessorKey: "bbg",
    header: "BBG",
    size: 100,
  },
  {
    accessorKey: "currency",
    header: "Currency",
    size: 80,
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "exchange",
    header: "Exchange",
  },
  {
    accessorKey: "isin",
    header: "ISIN",
  },
  {
    accessorKey: "lotSize",
    header: "Lotsize",
    size: 80,
  },
  {
    accessorKey: "ric",
    header: "RIC",
    size: 100,
  },
];

export const WithPaginationFillContainer = () => {
  const { VuuDataSource } = useDataSource();
  const dataSource = useMemo(() => {
    return new VuuDataSource(dataSourceProps);
  }, [VuuDataSource]);

  return (
    <div style={{ height: 600 }}>
      <TanstackTable<Instrument>
        columns={instrumentColumns}
        dataSource={dataSource}
        rowHeight={32}
        showPaginationControls
      />
    </div>
  );
};

export const WithScrollingFillContainer = () => {
  const { VuuDataSource } = useDataSource();
  const dataSource = useMemo(() => {
    return new VuuDataSource(dataSourceProps);
  }, [VuuDataSource]);

  return (
    <div style={{ height: 600 }}>
      <TanstackTable<Instrument>
        columns={instrumentColumns}
        dataSource={dataSource}
        rowHeight={25}
      />
    </div>
  );
};

export const WithColumnMenuFillContainer = () => {
  const { VuuDataSource } = useDataSource();
  const dataSource = useMemo(() => {
    return new VuuDataSource(dataSourceProps);
  }, [VuuDataSource]);

  return (
    <div style={{ height: 600 }}>
      <TanstackTable<Instrument>
        columns={instrumentColumns}
        dataSource={dataSource}
        rowHeight={32}
        showColumnMenu={{
          allowGrouping: true,
          allowHide: true,
          allowInlineFilters: true,
          allowSort: true,
        }}
      />
    </div>
  );
};

export const FlexLayoutTables = () => {
  const [ds1, ds2, ds3, ds4] = useMemo(() => {
    return [
      vuuModule("SIMUL").createDataSource("instruments"),
      vuuModule("SIMUL").createDataSource("instruments"),
      vuuModule("SIMUL").createDataSource("instruments"),
      vuuModule("SIMUL").createDataSource("instruments"),
    ];
  }, []);

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ flexDirection: "column", width: "100%", height: "100%" }}
      >
        <FlexboxLayout resizeable style={{ flexDirection: "row", flex: 1 }}>
          <View resizeable style={{ flex: 1 }}>
            <TanstackTable<Instrument>
              columns={instrumentColumns}
              dataSource={ds1}
              rowHeight={32}
              showPaginationControls
            />
          </View>

          <View resizeable style={{ flex: 1 }}>
            {/* <TanstackTable<Instrument>
              columns={instrumentColumns}
              dataSource={ds2}
              rowHeight={32}
            /> */}
          </View>
        </FlexboxLayout>
        <FlexboxLayout resizeable style={{ flexDirection: "row", flex: 1 }}>
          <View resizeable style={{ flex: 1 }}>
            {/* <TanstackTable<Instrument>
              columns={instrumentColumns}
              dataSource={ds3}
              rowHeight={32}
            /> */}
          </View>

          <View resizeable style={{ flex: 1 }}>
            {/* <TanstackTable<Instrument>
              columns={instrumentColumns}
              dataSource={ds4}
              rowHeight={32}
            /> */}
          </View>
        </FlexboxLayout>
      </FlexboxLayout>
    </LayoutProvider>
  );
};

const ordersColumns: Array<TableColumnDef<object>> = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "side", header: "Side" },
  { accessorKey: "status" },
  { accessorKey: "ric" },
  { accessorKey: "algo" },
  { accessorKey: "ccy" },
  { accessorKey: "quantity" },
  { accessorKey: "filledQuantity" },
  { accessorKey: "account" },
  { accessorKey: "trader" },
  { accessorKey: "created" },
  { accessorKey: "lastUpdated" },
  { accessorKey: "column13" },
  { accessorKey: "column14" },
  { accessorKey: "column15" },
  { accessorKey: "column16" },
  { accessorKey: "column17" },
  { accessorKey: "column18" },
  { accessorKey: "column19" },
  { accessorKey: "column20" },
  { accessorKey: "column21" },
  { accessorKey: "column22" },
  { accessorKey: "column23" },
  { accessorKey: "column24" },
  { accessorKey: "column25" },
  { accessorKey: "column26" },
  { accessorKey: "column27" },
  { accessorKey: "column28" },
  { accessorKey: "column29" },
  { accessorKey: "column30" },
  { accessorKey: "column31" },
  { accessorKey: "column32" },
  { accessorKey: "column33" },
  { accessorKey: "column34" },
  { accessorKey: "column35" },
  { accessorKey: "column36" },
  { accessorKey: "column37" },
  { accessorKey: "column38" },
  { accessorKey: "column39" },
  { accessorKey: "column40" },
];

/** tags=data-consumer */
export const VirtualisedColumns = () => {
  const { VuuDataSource } = useDataSource();
  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: ordersColumns.map(({ accessorKey }) => accessorKey),
      table: { module: "ORDERS", table: "orders" },
    });
  }, [VuuDataSource]);

  return (
    <div style={{ height: 600 }}>
      <TanstackTable<object>
        columns={ordersColumns}
        dataSource={dataSource}
        rowHeight={32}
      />
    </div>
  );
};
