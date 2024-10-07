import { RestDataSource } from "@finos/vuu-data-remote";
import { ServerAPI } from "@finos/vuu-data-types";
import {
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRpcMenuRequest,
  VuuRpcServiceRequest,
  VuuRpcViewportRequest,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { DataSourceProvider } from "@finos/vuu-utils";
import { ReactNode } from "react";

const serverAPI: Pick<
  ServerAPI,
  "getTableList" | "getTableSchema" | "rpcCall"
> = {
  getTableList: async () => {
    console.log(`Rest data source does not yet support table list`);
    return { tables: [] };
  },
  getTableSchema: async (vuuTable: VuuTable) => {
    throw Error(
      `Rest data source does not yet support table schema (${vuuTable.table})`,
    );
  },
  rpcCall: async (
    message:
      | VuuRpcServiceRequest
      | VuuRpcMenuRequest
      | VuuRpcViewportRequest
      | VuuCreateVisualLink
      | VuuRemoveVisualLink,
  ) =>
    Promise.reject(
      Error(`Rest data source does not yet support RPC (${message.type})`),
    ),
};

const getServerAPI = async () => serverAPI;

export const RestDataSourceProvider = ({
  children,
  url,
}: {
  children: ReactNode;
  url: string;
}) => {
  // url is a static property
  RestDataSource.api = url;
  return (
    <DataSourceProvider
      VuuDataSource={RestDataSource}
      getServerAPI={getServerAPI}
      isLocalData={false}
    >
      {children}
    </DataSourceProvider>
  );
};
