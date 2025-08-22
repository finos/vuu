import { Table } from "@vuu-ui/vuu-table";
import { useCallback, useMemo } from "react";
import { getSchema, SimulTableName } from "@vuu-ui/vuu-data-test";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import { Button } from "@salt-ds/core";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { DataSource } from "@vuu-ui/vuu-data-types";
import { VuuRpcServiceRequest } from "@vuu-ui/vuu-protocol-types";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { FreezeControl } from "@vuu-ui/vuu-table-extras";

/** tags=data-consumer */
export const TableFreezing = () => {
  const { VuuDataSource } = useData();

  const [config, dataSource] = useMemo<[TableConfig, DataSource]>(() => {
    const tableName: SimulTableName = "parentOrders";
    const schema = getSchema(tableName);
    return [
      {
        columns: schema.columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    ];
  }, [VuuDataSource]);

  const startOrderCreation = useCallback(() => {
    dataSource
      .rpcRequest?.({
        rpcName: "startGeneratingNewOrders",
        type: "RPC_REQUEST",
      } as Omit<VuuRpcServiceRequest, "context">)
      .then((response) => {
        if (response?.type === "ERROR_RESULT") {
          console.log("PPC failure");
        } else {
          console.log("PPC success");
        }
      });
  }, [dataSource]);
  const stopOrderCreation = useCallback(() => {
    dataSource
      .rpcRequest?.({
        rpcName: "stopGeneratingNewOrders",
        type: "RPC_REQUEST",
      } as Omit<VuuRpcServiceRequest, "context">)
      .then((response) => {
        if (response?.type === "ERROR_RESULT") {
          console.log("PPC failure");
        } else {
          console.log("PPC suvccess");
        }
      });
  }, [dataSource]);

  return (
    <div style={{ height: 700 }}>
      <div style={{ alignItems: "center", display: "flex", height: 50 }}>
        <Button onClick={() => startOrderCreation()}>
          Start Order Creation
        </Button>
        <Button onClick={() => stopOrderCreation()}>Stop Order Creation</Button>
        <FreezeControl dataSource={dataSource} />
      </div>
      <Table
        config={config}
        dataSource={dataSource}
        height={600}
        navigationStyle="row"
        renderBufferSize={5}
        width={723}
      />
      <DataSourceStats dataSource={dataSource} />
    </div>
  );
};
