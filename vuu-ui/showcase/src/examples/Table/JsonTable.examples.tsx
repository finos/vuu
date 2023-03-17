import { JsonDataSource } from "@finos/vuu-data";
import { Table } from "@finos/vuu-table";
import { JsonData } from "@finos/vuu-utils";
import { useMemo } from "react";
import packageJson from "../../../../package.json";

let displaySequence = 1;

const json: JsonData = {
  test1: "string 1",
  test2: "string 2",
  test3: "string 3",
  test4: "string 4",
  test5: "string 5",
  test6: "string 6",
  test7: "string 7",
  test8: "string 8",
  test9: "string 9",
  test10: 10,
  test11: 11,
  test12: 12,
  test13: 13,
  test14: {
    "nested 14.1": "test 14.1",
    "nested 14.2": {
      "nested 14.2.1": "test 14.2.1",
      "nested 14.2.2": "test 14.2.1",
    },
    "nested 14.3": "test 14.3",
    "nested 14.4": "test 14.4",
  },
  test15: {
    "nested 15.1": "test 15.1",
    "nested 15.2": {
      "nested 15.2.1": "test 15.2.1",
      "nested 15.2.2": "test 15.2.1",
    },
    "nested 15.3": {
      "nested 15.3.1": "test 15.3.1",
      "nested 15.3.2": {
        "nested 15.3.2.1": "test 15.3.2.1",
        "nested 15.3.2.2": "test 15.3.2.2",
      },
      "nested 15.3.3": "test 15.3",
      "nested 15.3.4": "test 15.4",
    },
    "nested 15.4": "test 15.4",
    "nested 15.5": "test 15.5",
  },
};

export const DefaultJsonTable = () => {
  const dataSource = useMemo(() => {
    return new JsonDataSource({ data: json });
  }, []);

  const tableConfig = useMemo(() => {
    return {
      columns: dataSource.columnDescriptors,
    };
  }, [dataSource.columnDescriptors]);

  console.log({ tableConfig });

  return (
    <>
      <Table
        config={tableConfig}
        dataSource={dataSource}
        height={700}
        renderBufferSize={20}
        selectionModel="none"
        width={500}
        zebraStripes
      />
    </>
  );
};
DefaultJsonTable.displaySequence = displaySequence++;

export const PackageJsonTable = () => {
  const dataSource = useMemo(() => {
    return new JsonDataSource({ data: packageJson });
  }, []);

  const tableConfig = useMemo(() => {
    return {
      columns: dataSource.columnDescriptors,
    };
  }, [dataSource.columnDescriptors]);

  console.log({ tableConfig });

  return (
    <>
      <Table
        config={tableConfig}
        dataSource={dataSource}
        height={700}
        renderBufferSize={20}
        selectionModel="none"
        width={700}
      />
    </>
  );
};
DefaultJsonTable.displaySequence = displaySequence++;
