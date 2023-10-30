import { JsonTable } from "@finos/vuu-datatable";
import { JsonData } from "@finos/vuu-utils";
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
  return (
    <>
      <JsonTable
        source={json}
        height={700}
        renderBufferSize={20}
        selectionModel="none"
        width={500}
        config={{
          columnSeparators: true,
          rowSeparators: true,
          zebraStripes: true,
        }}
      />
    </>
  );
};
DefaultJsonTable.displaySequence = displaySequence++;

const jsonArraySimpleData = {
  test1: "string 1",
  test2: "string 2",
  test3: ["test3.1", "test3.2", "test3.3"],
};

export const JsonTableArraySimpleData = () => {
  return (
    <>
      <JsonTable
        source={jsonArraySimpleData}
        height={700}
        renderBufferSize={20}
        selectionModel="none"
        width={500}
        config={{
          columnSeparators: true,
          rowSeparators: true,
          zebraStripes: true,
        }}
      />
    </>
  );
};
JsonTableArraySimpleData.displaySequence = displaySequence++;

const jsonArrayJsonData = {
  test1: "string 1",
  test2: "string 2",
  test3: [
    { "test3.1": "test value 3.1" },
    { "test3.2": "test value 3.2" },
    { "test3.3": "test value 3.3" },
  ],
};

export const JsonTableArrayJsonData = () => {
  return (
    <>
      <JsonTable
        source={jsonArrayJsonData}
        height={700}
        renderBufferSize={20}
        selectionModel="none"
        width={500}
        config={{
          columnSeparators: true,
          rowSeparators: true,
          zebraStripes: true,
        }}
      />
    </>
  );
};
JsonTableArrayJsonData.displaySequence = displaySequence++;

export const PackageJsonTable = () => {
  return (
    <>
      <JsonTable
        source={packageJson}
        height={700}
        renderBufferSize={20}
        selectionModel="none"
        width={700}
      />
    </>
  );
};
PackageJsonTable.displaySequence = displaySequence++;
