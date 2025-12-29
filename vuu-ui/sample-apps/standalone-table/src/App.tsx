import { Flexbox, View } from "@vuu-ui/vuu-layout";
import { Table } from "@vuu-ui/vuu-table";
import { simulSchemas, simulModule } from "@vuu-ui/vuu-data-test";
import { ThemeProvider } from "@vuu-ui/vuu-utils";
import { ContextPanel } from "@vuu-ui/vuu-shell";

import "@vuu-ui/vuu-icons/index.css";
import "@vuu-ui/vuu-theme-deprecated/index.css";

import "./App.css";
// import { ThemeProvider } from "@vuu-ui/vuu-utils";

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
