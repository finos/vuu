import { Table } from "@finos/vuu-table";
import { getSchema, SimulTableName, vuuModule } from "@finos/vuu-data-test";

// import "@finos/vuu-icons/index.css";
// import "@finos/vuu-theme/index.css";

import "./App.css";
// import { ThemeProvider } from "packages/vuu-utils/src";

export const App = () => {
  const columnDescriptors = [{ name: "Column 1" }, { name: "Column 2" }];
  // const dataSource = new ArrayDataSource({
  //   columnDescriptors,
  //   data: [
  //     ["test1", 1000],
  //     ["test2", 2000],
  //     ["test3", 3000],
  //     ["test4", 4000],
  //     ["test5", 5000],
  //     ["test6", 6000],
  //   ],
  // });
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
