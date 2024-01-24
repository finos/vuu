import { Table } from "@finos/vuu-table";
import { getSchema, SimulTableName, vuuModule } from "@finos/vuu-data-test";

// import "@finos/vuu-icons/index.css";
// import "@finos/vuu-theme/index.css";

import "./App.css";
// import { ThemeProvider } from "@finos/vuu-utils";

export const App = () => {
  const schema = getSchema("instruments");
  const dataSource =
    vuuModule<SimulTableName>("SIMUL").createDataSource("instruments");

  const tableConfig = {
    columns: schema.columns,
  };

  return (
    // <ThemeProvider applyThemeClasses>
    <Table config={tableConfig} dataSource={dataSource} renderBufferSize={30} />
    // </ThemeProvider>
  );
};
