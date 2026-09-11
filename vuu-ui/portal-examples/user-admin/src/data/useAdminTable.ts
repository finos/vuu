import { useData } from "@vuu-ui/core";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { NotificationType, useNotifications } from "@vuu-ui/vuu-notifications";
import { filterAsQuery, Range } from "@vuu-ui/vuu-utils";
import { useEffect, useState } from "react";
import { useAdminConfig } from "./AdminDataContext";
import {
  buildFilter,
  errorMessage,
  tableFor,
  type AdminQuery,
  type AdminTableName,
} from "./admin-contract";

export interface AdminTableResource {
  dataSource?: DataSource;
  schema?: TableSchema;
  error?: string;
  loading: boolean;
}

export const useAdminTable = (
  name: AdminTableName,
  { search, equals }: AdminQuery = {},
): AdminTableResource => {
  const { getServerAPI, VuuDataSource } = useData();
  const config = useAdminConfig();
  const { showNotification } = useNotifications();
  const [resource, setResource] = useState<AdminTableResource>({
    loading: true,
  });
  const field = equals?.field;
  const value = equals?.value;

  useEffect(() => {
    let active = true;
    let dataSource: DataSource | undefined;
    setResource({ loading: true });
    const load = async () => {
      try {
        const api = await getServerAPI();
        const schema = await api.getTableSchema(tableFor(config, name));
        if (!active) return;
        const filter = buildFilter(schema, config, name, {
          search,
          equals:
            field !== undefined && value !== undefined
              ? { field, value }
              : undefined,
        });
        const columnsByName = Object.fromEntries(
          schema.columns.map((column) => [column.name, column]),
        );
        dataSource = new VuuDataSource({
          bufferSize: 200,
          columns: schema.columns.map(({ name: column }) => column),
          table: schema.table,
          filterSpec: {
            filter: filter ? filterAsQuery(filter, { columnsByName }) : "",
          },
          sessionTableMessageColumn: "vuuMsg",
        });
        // Tables own their viewport callback; intercept failures without a second subscription.
        const subscribe = dataSource.subscribe.bind(dataSource);
        const fail = (cause: unknown) => {
          if (!active) return;
          const error = errorMessage(cause);
          setResource({ loading: false, error });
          showNotification({
            type: NotificationType.Toast,
            status: "error",
            header: `Unable to subscribe to ${name}`,
            content: error,
          });
        };
        dataSource.subscribe = async (props, callback) => {
          try {
            await subscribe(props, (message) => {
              if (message.type === "subscribe-failed") fail(message.msg);
              callback(message);
            });
          } catch (cause) {
            fail(cause);
          }
        };
        setResource({ loading: false, schema, dataSource });
      } catch (cause) {
        if (!active) return;
        const error = errorMessage(cause);
        setResource({ loading: false, error });
        showNotification({
          type: NotificationType.Toast,
          status: "error",
          header: `Unable to load ${name}`,
          content: error,
        });
      }
    };
    void load();
    return () => {
      active = false;
      dataSource?.unsubscribe();
    };
  }, [
    config,
    field,
    getServerAPI,
    name,
    search,
    showNotification,
    value,
    VuuDataSource,
  ]);

  return resource;
};

export const useAdminCount = (name: AdminTableName) => {
  const resource = useAdminTable(name);
  const { dataSource } = resource;
  const [count, setCount] = useState<number>();
  const [error, setError] = useState<string>();
  const { showNotification } = useNotifications();
  useEffect(() => {
    setCount(undefined);
    setError(undefined);
    if (!dataSource) return;
    let active = true;
    const fail = (cause: unknown) => {
      if (!active) return;
      const message = errorMessage(cause);
      setError(message);
      showNotification({
        type: NotificationType.Toast,
        status: "error",
        header: `Unable to count ${name}`,
        content: message,
      });
    };
    const resize = (size: number) => {
      if (active) setCount(size);
    };
    dataSource.on("resize", resize);
    void dataSource
      .subscribe({ range: Range(0, 1) }, (message) => {
        if (!active) return;
        if (message.type === "viewport-update" && message.size !== undefined) {
          setCount(message.size);
        } else if (message.type === "subscribe-failed") {
          fail(message.msg);
        }
      })
      .catch(fail);
    return () => {
      active = false;
      dataSource.removeListener("resize", resize);
      dataSource.unsubscribe();
    };
  }, [dataSource, name, showNotification]);
  return {
    count,
    error: resource.error ?? error,
    loading: resource.loading || count === undefined,
  };
};
