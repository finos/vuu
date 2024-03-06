import { Flexbox, View } from "@finos/vuu-layout";
import { Table } from "@finos/vuu-table";
import { simulSchemas, simulModule } from "@finos/vuu-data-test";
import { ThemeProvider } from "@finos/vuu-utils";
import { ContextPanel } from "@finos/vuu-shell";

import "@finos/vuu-icons/index.css";
import "@finos/vuu-theme/index.css";

import "./App.css";
// import { ThemeProvider } from "@finos/vuu-utils";

console.log({ ContextPanel });

export const App = () => {
  const schema = simulSchemas.instruments;
  const dataSource1 = simulModule.createDataSource("instruments");
  const dataSource2 = simulModule.createDataSource("instruments");

  const tableConfig = {
    columns: schema.columns,
  };

  return (
    <ThemeProvider applyThemeClasses>
      <Flexbox
        style={{ flexDirection: "column", height: "100vh", width: "100vw" }}
      >
        <View style={{ flex: 1 }}>
          <Table config={tableConfig} dataSource={dataSource1} />
        </View>
        <View style={{ flex: 1 }}>
          <Table config={tableConfig} dataSource={dataSource2} />
        </View>
      </Flexbox>
    </ThemeProvider>
  );
};
