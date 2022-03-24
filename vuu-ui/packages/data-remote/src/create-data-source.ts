import RemoteDataSource from './remote-data-source';
import { getServerUrl } from './hooks/useServerConnection';
import {Column} from "../../utils/src";

const DEFAULT_BUFFER_SIZE = 300;

export interface DataSourceSchema {
  columns: Column[];
}

export interface DataSourceOptions {
  id: string;
  tableName: string;
  schema: DataSourceSchema;
  serverUrl?: string;
  config: any; // TODO
  bufferSize?: number;
}

export const createDataSource = ({
  id,
  tableName,
  schema,
  serverUrl = getServerUrl(),
  config,
  bufferSize = DEFAULT_BUFFER_SIZE
}: DataSourceOptions) =>
  new RemoteDataSource({
    bufferSize,
    serverName: 'Vuu',
    tableName,
    serverUrl,
    viewport: id,
    ...config,
    columns: (config?.columns || schema.columns).map((col) =>
      typeof col === 'string' ? col : col.name
    )
  });
