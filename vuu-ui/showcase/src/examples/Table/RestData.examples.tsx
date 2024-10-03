import { RestDataSourceProvider } from "@finos/vuu-data-react/src/datasource-provider/RestDataSourceProvider";
import { SimulTableName, getSchema } from "@finos/vuu-data-test";
import { View } from "@finos/vuu-layout";
import { Table, TableProps } from "@finos/vuu-table";
import { useMemo } from "react";
import { useDataSource } from "@finos/vuu-utils";

let displaySequence = 0;

const RestTableTemplate = ({
  rowClassNameGenerators,
  tableName = "instruments",
  ...props
}: Partial<TableProps> & {
  rowClassNameGenerators?: string[];
  tableName?: SimulTableName;
}) => {
  const schema = getSchema(tableName);
  const { VuuDataSource } = useDataSource();

  const tableProps = useMemo<
    Pick<TableProps, "config" | "dataSource" | "showPaginationControls">
  >(
    () => ({
      config: {
        columns: schema.columns,
        rowSeparators: true,
        zebraStripes: true,
      },
      dataSource: new VuuDataSource({ table: schema.table }),
      showPaginationControls: true,
    }),
    [VuuDataSource, schema],
  );

  return (
    <View style={{ height: 602, width: 802 }}>
      <Table {...tableProps} {...props} />
    </View>
  );
};

export const RestInstruments = () => {
  return (
    <RestDataSourceProvider url="http://localhost:8081/api">
      <RestTableTemplate />
    </RestDataSourceProvider>
  );
};
RestInstruments.displaySequence = displaySequence++;
