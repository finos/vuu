import { VuuTable } from "../../vuu-protocol-types";
import { Column } from "@vuu-ui/vuu-utils";

import { getServerUrl } from "./hooks/useServerConnection";
import { RemoteDataSource } from "./remote-data-source";

const DEFAULT_BUFFER_SIZE = 300;
// const DEFAULT_BUFFER_SIZE = 0;

export interface DataSourceSchema {
  columns: Column[];
}

export interface DataSourceOptions {
  id: string;
  table: VuuTable;
  schema: DataSourceSchema;
  serverUrl?: string;
  config: any; // TODO
  bufferSize?: number;
}

export const createDataSource = ({
  id,
  table,
  schema,
  serverUrl = getServerUrl(),
  config,
  bufferSize = DEFAULT_BUFFER_SIZE,
}: DataSourceOptions) =>
  new RemoteDataSource({
    bufferSize,
    table,
    serverUrl,
    viewport: id,
    ...config,
    columns: (config?.columns || schema.columns).map((col: string | Column) =>
      typeof col === "string" ? col : col.name
    ),
  });
