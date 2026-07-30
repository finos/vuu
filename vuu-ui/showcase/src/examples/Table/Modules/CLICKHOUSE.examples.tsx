import { Table, TableProps } from "@vuu-ui/vuu-table";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { DemoTableContainer } from "../DemoTableContainer";
import { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import { TableConfig } from "@vuu-ui/vuu-table-types";

const schema: TableSchema = {
    columns: [
        { name: 'orderId', serverDataType: 'long' },
        { name: 'quantity', serverDataType: 'int' },
        { name: 'price', serverDataType: 'long' },
        { name: 'side', serverDataType: 'string' },
        { name: 'trader', serverDataType: 'string' },
    ],
    key: 'orderId',
    table: { module: 'CLICKHOUSE', table: 'orderHistory' }
}

const tableContainerStyle = { flex: "1 1 auto" };


const ClickHouseTableTemplate = ({ dataBufferSize, renderBufferSize = 0 }: { dataBufferSize?: number } & Pick<TableProps, "renderBufferSize">) => {

    const { VuuDataSource } = useData();

    const [config, dataSource] = useMemo<[TableConfig, DataSource]>(
        () => [
            {
                columns: schema.columns,
                columnDefaultWidth: 200,
                rowSeparators: true,
                zebraStripes: true,
            },

            new VuuDataSource({
                columns: schema.columns.map(toColumnName),
                bufferSize: dataBufferSize,
                table: schema.table,
            }),
        ],
        [VuuDataSource, schema.columns, schema.table],
    );

    return (
        <>
            <div className="DemoTableContainer-table" style={tableContainerStyle}>
                <Table config={config} dataSource={dataSource} renderBufferSize={renderBufferSize} />
            </div>
            <TableFooter>
                <DataSourceStats dataSource={dataSource} />
            </TableFooter>
        </>
    )
};

export const TenMillionOrders = () => (
    <VuuDataSourceProvider authenticate autoConnect autoLogin
        websocketUrl="wss://localhost:8090/websocket">
        <DemoTableContainer>
            <ClickHouseTableTemplate />
        </DemoTableContainer>
    </VuuDataSourceProvider>
);

export const WithNoBufferingAtAll = () => (
    <VuuDataSourceProvider authenticate autoConnect autoLogin
        websocketUrl="wss://localhost:8090/websocket">
        <DemoTableContainer>
            <ClickHouseTableTemplate dataBufferSize={0} renderBufferSize={0} />
        </DemoTableContainer>
    </VuuDataSourceProvider>
);

export const WithRenderBufferingOnly = () => (
    <VuuDataSourceProvider authenticate autoConnect autoLogin
        websocketUrl="wss://localhost:8090/websocket">
        <DemoTableContainer>
            <ClickHouseTableTemplate dataBufferSize={0} renderBufferSize={50} />
        </DemoTableContainer>
    </VuuDataSourceProvider>
);
