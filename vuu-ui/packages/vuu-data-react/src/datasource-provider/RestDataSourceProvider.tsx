import { RestDataSource } from "@vuu-ui/vuu-data-remote";
import {
  DataSourceConstructorProps,
  ServerAPI,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import {
  VuuCreateVisualLink,
  VuuRemoveVisualLink,
  VuuRpcMenuRequest,
  VuuRpcServiceRequest,
  VuuRpcViewportRequest,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import { DataSourceProvider, isObject } from "@vuu-ui/vuu-utils";
import { ReactNode } from "react";

const serverAPI = (
  schemas?: Record<string, TableSchema>,
): Pick<ServerAPI, "getTableList" | "getTableSchema" | "rpcCall"> => ({
  getTableList: async () => {
    if (schemas) {
      return {
        tables: Object.keys(schemas).map((key) => {
          const [module, table] = key.split(":");
          return { module, table };
        }),
      };
    } else {
      console.log(`Rest data source does not yet support table list`);
      return { tables: [] };
    }
  },
  getTableSchema: async ({ module, table }: VuuTable) => {
    const schema = schemas?.[`${module}:${table}`];
    if (schema) {
      return schema;
    } else {
      throw Error(
        `Rest data source does not yet support table schema (${table})`,
      );
    }
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
});

const getServerAPI = (schemas?: Record<string, TableSchema>) => async () =>
  serverAPI(schemas);

export type RestDataSourceExtension = {
  createHttpHeaders?: () => Headers;
};

export const isRestDataSourceExtension = (
  o?: unknown,
): o is RestDataSourceExtension => {
  return (
    isObject(o) &&
    "createHttpHeaders" in o &&
    typeof o["createHttpHeaders"] === "function"
  );
};

const getRestDataSourceClass = ({
  createHttpHeaders,
}: RestDataSourceExtension) => {
  if (createHttpHeaders) {
    return class ExtendedClass extends RestDataSource {
      constructor(props: DataSourceConstructorProps) {
        super(props);
      }
      get httpHeaders(): Headers | undefined {
        return createHttpHeaders();
      }
    };
  } else {
    return RestDataSource;
  }
};

export const RestDataSourceProvider = ({
  children,
  createHttpHeaders,
  tableSchemas,
  url,
}: {
  children: ReactNode;
  tableSchemas?: Record<string, TableSchema>;
  url: string;
} & RestDataSourceExtension) => {
  RestDataSource.api = url;

  const restDataSourceClass = getRestDataSourceClass({ createHttpHeaders });

  return (
    <DataSourceProvider
      VuuDataSource={restDataSourceClass}
      dataSourceExtensions={{ createHttpHeaders }}
      getServerAPI={getServerAPI(tableSchemas)}
      isLocalData={false}
      tableSchemas={tableSchemas}
    >
      {children}
    </DataSourceProvider>
  );
};
