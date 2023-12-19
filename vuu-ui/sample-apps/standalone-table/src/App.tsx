import { Table } from "@finos/vuu-table";
import { ArrayDataSource } from "@finos/vuu-data-local";

import "./App.css";

export const App = () => {
  const columnDescriptors = [{ name: "Column 1" }, { name: "Column 2" }];
  const dataSource = new ArrayDataSource({
    columnDescriptors,
    data: [
      ["test1", 1000],
      ["test2", 2000],
      ["test3", 3000],
      ["test4", 4000],
      ["test5", 5000],
      ["test6", 6000],
    ],
  });

  const tableConfig = {
    columns: columnDescriptors,
  };

  return <Table config={tableConfig} dataSource={dataSource} />;
};
