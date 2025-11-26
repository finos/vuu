import { getSchema } from "@vuu-ui/vuu-data-test";
import { FlexboxLayout, LayoutProvider, View } from "@vuu-ui/vuu-layout";
import { Table } from "@vuu-ui/vuu-table";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";

const parentSchema = getSchema("LinkParent");
const childSchema = getSchema("LinkChild");

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
          <Table
            config={{ columns: parentSchema.columns, columnDefaultWidth: 150 }}
            dataSource={ds1}
          />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <Table
            config={{ columns: childSchema.columns, columnDefaultWidth: 150 }}
            dataSource={ds3}
          />
        </View>
      </FlexboxLayout>
    </LayoutProvider>
  );
};
