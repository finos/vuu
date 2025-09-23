import { SchemaColumn } from "@vuu-ui/vuu-data-types";
import { SimulTable } from "./SimulTableTemplate";

export const AllColumnsSubscribed = () => {
  return <SimulTable />;
};

export const AllColumnsSubscribedNotAllRendered = () => {
  const availableColumns: SchemaColumn[] = [
    { name: "bbg", serverDataType: "string" },
    { name: "currency", serverDataType: "string" },
    { name: "description", serverDataType: "string" },
    { name: "exchange", serverDataType: "string" },
    { name: "lotSize", serverDataType: "int" },
    { name: "ric", serverDataType: "string" },
  ];
  const columns = [{ name: "bbg" }, { name: "lotSize" }, { name: "ric" }];

  return <SimulTable availableColumns={availableColumns} columns={columns} />;
};
