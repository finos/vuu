import { Flexbox, View } from "@vuu-ui/vuu-layout";
import { Table } from "@vuu-ui/vuu-table";
import { Accent, SaltProviderNext } from "@salt-ds/core";
import { toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useMemo, useState } from "react";
import { TableSchema } from "@vuu-ui/vuu-data-types";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme/index.css";
import "./App.css";

const accentPurple = "purple" as Accent;

export const App = () => {
  const { VuuDataSource, getServerAPI } = useData();
  const [schema, setSchema] = useState<TableSchema | undefined>(undefined);

  useMemo(async () => {
    const serverAPI = await getServerAPI();
    const schema = await serverAPI.getTableSchema({
      module: "SIMUL",
      table: "instruments",
    });
    setSchema(schema);
  }, [getServerAPI]);

  const dataSource = useMemo(() => {
    return schema
      ? new VuuDataSource({
          columns: schema?.columns.map(toColumnName),
          table: schema.table,
        })
      : undefined;
  }, [VuuDataSource, schema]);

  const tableConfig = {
    columns: schema?.columns ?? [],
  };

  return (
    <SaltProviderNext
      accent={accentPurple}
      corner="rounded"
      theme="vuu-theme"
      density="high"
      mode="light"
    >
      <Flexbox
        style={{ flexDirection: "column", height: "100vh", width: "100vw" }}
      >
        <View style={{ flex: 1 }}>
          {dataSource ? (
            <Table config={tableConfig} dataSource={dataSource} />
          ) : null}
        </View>
      </Flexbox>
    </SaltProviderNext>
  );
};
