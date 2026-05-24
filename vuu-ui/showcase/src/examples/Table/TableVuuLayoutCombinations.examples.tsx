import { LayoutProvider, Stack, View } from "@vuu-ui/vuu-layout";
import { useMemo, useState } from "react";
import { SimulTable } from "./SimulTableTemplate";
import { useSessionDataSource } from "@vuu-ui/vuu-data-react";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { toColumnName } from "@vuu-ui/vuu-utils";
import { DataSource } from "@vuu-ui/vuu-data-types";

const schema = getSchema("instruments");

/** tags=data-consumer */
export const TwoTabbedTables = () => {
  const [active, setActive] = useState(0);

  const { getDataSource } = useSessionDataSource();

  const [dataSource1, dataSource2] = useMemo<[DataSource, DataSource]>(() => {
    return [
      getDataSource("ds1", {
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
      getDataSource("ds2", {
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    ];
  }, [getDataSource]);

  return (
    <LayoutProvider>
      <Stack
        active={active}
        onTabSelectionChanged={setActive}
        style={{
          border: "solid 1px var(--salt-container-secondary-borderColor)",
          height: 500,
          margin: 10,
          width: 600,
        }}
      >
        <View title="Instruments 1">
          <SimulTable dataSource={dataSource1} height="100%" width="100%" />
        </View>
        <View title="Instruments 2">
          <SimulTable dataSource={dataSource2} height="100%" width="100%" />
        </View>
      </Stack>
    </LayoutProvider>
  );
};

export const FourTabbedTables = () => {
  const [active, setActive] = useState(0);
  return (
    <Stack
      active={active}
      onTabSelectionChanged={setActive}
      style={{
        border: "solid 1px var(--salt-container-secondary-borderColor)",
        height: 500,
        margin: 10,
        width: 600,
      }}
    >
      <View title="Instruments 1"></View>
      <View title="Instruments 2"></View>
      <View title="Instruments 3"></View>
      <View title="Instruments 4"></View>
    </Stack>
  );
};
