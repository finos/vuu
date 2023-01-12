import { DataSourceProps } from "./data-source";
import { getServerUrl } from "./hooks/useServerConnection";
import { RemoteDataSource } from "./remote-data-source";

const DEFAULT_BUFFER_SIZE = 300;

export const createDataSource = ({
  serverUrl = getServerUrl(),
  bufferSize = DEFAULT_BUFFER_SIZE,
  ...rest
}: DataSourceProps) =>
  new RemoteDataSource({
    bufferSize,
    serverUrl,
    ...rest,
  });
