import RemoteDataSource from './remote-data-source';
import { getServerUrl } from './hooks/useServerConnection';

const DEFAULT_BUFFER_SIZE = 300;

export const createDataSource = ({
  id,
  tableName,
  schema,
  serverUrl = getServerUrl(),
  config,
  bufferSize = DEFAULT_BUFFER_SIZE
}) =>
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
