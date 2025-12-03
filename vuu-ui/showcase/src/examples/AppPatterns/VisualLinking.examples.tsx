import { getSchema } from "@vuu-ui/vuu-data-test";
import { FlexboxLayout, LayoutProvider, View } from "@vuu-ui/vuu-layout";
import { Table } from "@vuu-ui/vuu-table";
import { DataSourceStats } from "@vuu-ui/vuu-table-extras";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

const parentSchema = getSchema("LinkParent");
const childSchema = getSchema("LinkChild");

const tableContainerStyle = { flex: "1 1 auto" };
const footerContainerStyle = { flex: "0 0 32px" };

/** tags=data-consumer */
export const FlexLayoutTables = () => {
  const { VuuDataSource } = useData();

  const [ds1, ds3] = useMemo(() => {
    return [
      new VuuDataSource({
        columns: parentSchema.columns.map(toColumnName),
        table: { module: "TEST", table: "LinkParent" },
        viewport: "parent-table",
      }),
      new VuuDataSource({
        columns: childSchema.columns.map(toColumnName),
        table: { module: "TEST", table: "LinkChild" },
        viewport: "child-table",
        visualLink: {
          link: {
            fromColumn: "parentId",
            toColumn: "id",
            toTable: "parent-table",
          },
          parentClientVpId: "parent-table",
          parentVpId: "parent-table",
        },
      }),
    ];
  }, [VuuDataSource]);

  return (
    <LayoutProvider>
      <FlexboxLayout
        style={{ flexDirection: "column", width: "100%", height: "100%" }}
      >
        <View resizeable style={{ flex: 1 }}>
          <div style={tableContainerStyle}>
            <Table
              config={{
                columns: parentSchema.columns,
                columnDefaultWidth: 150,
              }}
              dataSource={ds1}
            />
          </div>
          <div style={footerContainerStyle}>
            <DataSourceStats dataSource={ds1} />
          </div>
        </View>

        <View resizeable style={{ flex: 1 }}>
          <div style={tableContainerStyle}>
            <Table
              config={{ columns: childSchema.columns, columnDefaultWidth: 150 }}
              dataSource={ds3}
            />
          </div>
          <div style={footerContainerStyle}>
            <DataSourceStats dataSource={ds3} />
          </div>
        </View>
      </FlexboxLayout>
    </LayoutProvider>
  );
};
