import {
  DataSource,
  DataSourceConstructorProps,
  TableSchema,
} from "@finos/vuu-data-types";
import { useDataSource } from "@finos/vuu-utils";
import {
  LinkedDataSource,
  LinkedDataSources,
  LinkedTableViewProps,
} from "./LinkedTableView";
import { useMemo, useState } from "react";
import { TableConfig } from "@finos/vuu-table-types";
import { VuuTable } from "@finos/vuu-protocol-types";

type TableDataSourceConfig = {
  config: TableConfig;
  dataSource: DataSource;
};

export type LinkedTableConfig = {
  "1": TableDataSourceConfig;
  "2": Array<TableDataSourceConfig>;
  "3"?: Array<TableDataSourceConfig>;
};

export type LinkedTableViewHookProps = Pick<
  LinkedTableViewProps,
  "linkedDataSources"
>;

const getSchema = (schemas: TableSchema[], { module, table }: VuuTable) => {
  const schema = schemas.find(
    ({ table: t }) => t.module === module && t.table === table,
  );
  if (schema) {
    return schema;
  } else {
    throw Error(`No schema for table ${module} ${table}`);
  }
};

const getTable = (ds: DataSourceConstructorProps | DataSource): VuuTable => {
  if (ds.table) {
    return ds.table;
  } else {
    throw Error("No datasource table specified");
  }
};

const getTables = (linkedDataSources: LinkedDataSources): VuuTable[] => {
  const { "1": linked1, "2": linked2, "3": linked3 } = linkedDataSources;

  const tables: VuuTable[] = [];

  tables.push(getTable(linked1));

  if (Array.isArray(linked2)) {
    linked2.forEach(({ dataSource }) => {
      tables.push(getTable(dataSource));
    });
  } else {
    tables.push(getTable(linked2.dataSource));
  }

  if (Array.isArray(linked3)) {
    linked3.forEach(({ dataSource }) => {
      tables.push(getTable(dataSource));
    });
  } else if (linked3) {
    tables.push(getTable(linked3.dataSource));
  }

  return tables;
};

export const useLinkedTableView = ({
  linkedDataSources,
}: LinkedTableViewHookProps) => {
  const { VuuDataSource, getServerAPI } = useDataSource();
  const [linkedTableConfig, setLinkedTableConfig] = useState<
    LinkedTableConfig | undefined
  >();

  useMemo(async () => {
    const tables = getTables(linkedDataSources);
    const serverAPI = await getServerAPI();
    const schemas = await Promise.all(tables.map(serverAPI.getTableSchema));

    console.log({ tables, schemas });

    const isDataSource = (
      ds: DataSourceConstructorProps | DataSource,
    ): ds is DataSource => typeof ds === typeof VuuDataSource;

    const getDataSource = (
      ds: DataSourceConstructorProps | DataSource,
    ): DataSource => {
      if (isDataSource(ds)) {
        return ds;
      } else {
        return new VuuDataSource(ds);
      }
    };

    const getTableConfig = (ds: DataSourceConstructorProps | DataSource) => {
      const schema = getSchema(schemas, getTable(ds));
      return {
        columns: schema.columns,
      };
    };

    const getLinkedConfig = (
      ds: DataSourceConstructorProps | DataSource,
    ): TableDataSourceConfig => ({
      config: getTableConfig(ds),
      dataSource: getDataSource(ds),
    });

    const getLinkedConfigs = (
      lds?: LinkedDataSource | LinkedDataSource[],
    ): TableDataSourceConfig[] => {
      if (lds === undefined) {
        return [];
      } else if (Array.isArray(lds)) {
        return lds.map(({ dataSource }) => getLinkedConfig(dataSource));
      } else {
        return [getLinkedConfig(lds.dataSource)];
      }
    };

    const { "1": level1, "2": level2, "3": level3 } = linkedDataSources;

    const results: LinkedTableConfig = {
      "1": getLinkedConfig(level1),
      "2": getLinkedConfigs(level2),
      "3": getLinkedConfigs(level3),
    };
    setLinkedTableConfig(results);
  }, [VuuDataSource, getServerAPI, linkedDataSources]);

  return {
    linkedTableConfig,
  };
};
