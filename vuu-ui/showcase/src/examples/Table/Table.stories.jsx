import React from "react";
import { Table } from "./Table";
import { Toolbar, ToggleButton } from "@heswell/uitk-lab";

import "./Table.css";

export default {
  title: "Table/Table",
  component: "table",
};

const columns = [
  { name: "row number", pin: "left", width: 150 },
  { name: "column 1", pin: "left", width: 120 },
  { name: "column 2", width: 120 },
  { name: "column 3", width: 120 },
  { name: "column 4", width: 120 },
  { name: "column 5", width: 120 },
  { name: "column 6", width: 120 },
  { name: "column 7", width: 120 },
  { name: "column 8", width: 120 },
  { name: "column 9", width: 120 },
  { name: "column 10", width: 120 },
];

const count = 100;
const data = [];
for (let i = 0; i < count; i++) {
  data.push([
    `row ${i + 1}`,
    "value 1",
    "value 2",
    "value 3",
    "value 4",
    "value 5",
    "value 6",
    "value 7",
    "value 8",
    "value 9",
    "value 10",
  ]);
}

export const BetterTable = () => {
  return (
    <>
      <Toolbar>
        <ToggleButton />
      </Toolbar>
      <Table columns={columns} data={data} height={700} width={700} />
    </>
  );
};
