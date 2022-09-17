import { Column } from '@vuu-ui/utils';

import { getServerUrl } from './hooks/useServerConnection';
import { RemoteDataSource } from './remote-data-source';

const DEFAULT_BUFFER_SIZE = 300;
// const DEFAULT_BUFFER_SIZE = 0;

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
    tableName,
    serverUrl,
    viewport: id,
    ...config,
    columns: (config?.columns || schema.columns).map((col: string | Column) =>
      typeof col === 'string' ? col : col.name
    )
  });
