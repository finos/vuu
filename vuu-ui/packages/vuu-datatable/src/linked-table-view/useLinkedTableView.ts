import {
  DataSource,
  DataSourceConstructorProps,
  TableSchema,
} from "@finos/vuu-data-types";
import { useDataSource } from "@finos/vuu-utils";
import {
  LinkedDataSources,
  LinkedTableConfig,
  LinkedTableViewProps,
  LinkTableConfig,
} from "./LinkedTableView";
import { useCallback, useMemo, useState } from "react";
import { TableConfig } from "@finos/vuu-table-types";
import { LinkDescriptorWithLabel, VuuTable } from "@finos/vuu-protocol-types";
import { useViewContext } from "@finos/vuu-layout";

export type TableDataSourceConfig = {
  config: TableConfig;
  dataSource: DataSource;
  title: string;
};

export type ResolvedTableConfig = {
  "1": TableDataSourceConfig;
  "2": TableDataSourceConfig | TableDataSourceConfig[];
  "3"?: TableDataSourceConfig | TableDataSourceConfig[];
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

const getTable = (ds: DataSource | DataSourceConstructorProps): VuuTable => {
  if (ds.table) {
    return ds.table;
  } else {
    throw Error("No datasource table specified");
  }
};

const getTables = (linkedDataSources: LinkedDataSources): VuuTable[] => {
  const { "1": linked1, "2": linked2, "3": linked3 } = linkedDataSources;

  const tables: VuuTable[] = [];

  tables.push(getTable(linked1.dataSource));

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
  const [tableConfig, setTableConfig] = useState<
    ResolvedTableConfig | undefined
  >();
  // TBC
  const { id } = useViewContext();
  console.log({ id });
  const [activeTabs, setActiveTab] = useState<[number, number, number]>([
    0, 0, 0,
  ]);
  const [collapsed, setCollapsed] = useState<[boolean, boolean]>([
    false,
    false,
  ]);

  useMemo(async () => {
    const tables = getTables(linkedDataSources);
    const serverAPI = await getServerAPI();
    const schemas = await Promise.all(tables.map(serverAPI.getTableSchema));

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

    const createVisualLink = (
      vuuLink: LinkedTableConfig["vuuLink"],
      parentDs?: DataSource,
    ) => {
      if (parentDs && parentDs.table) {
        const parentVpId = parentDs.viewport;
        const toTable = vuuLink.toTable ?? parentDs.table?.table;

        return {
          link: {
            ...vuuLink,
            toTable,
          },
          parentClientVpId: parentVpId,
          parentVpId,
        } as LinkDescriptorWithLabel;
      } else {
        throw Error("visual link cannot be created without parent vp id");
      }
    };

    const getLinkedDataSource = (
      ds: DataSourceConstructorProps | DataSource,
      vuuLink: LinkedTableConfig["vuuLink"],
      parentDs?: DataSource,
    ): DataSource => {
      if (isDataSource(ds)) {
        return ds;
      } else {
        return new VuuDataSource({
          ...ds,
          visualLink: createVisualLink(vuuLink, parentDs),
        });
      }
    };

    const getTableConfig = (ds: DataSourceConstructorProps | DataSource) => {
      const schema = getSchema(schemas, getTable(ds));
      return {
        columns: schema.columns,
      };
    };

    const getRootConfig = ({
      dataSource: ds,
      title,
    }: LinkTableConfig): TableDataSourceConfig => ({
      config: getTableConfig(ds),
      dataSource: getDataSource(ds),
      title,
    });

    const getLinkedConfig = (
      { dataSource: ds, vuuLink, title }: LinkedTableConfig,
      parentDataSource?: DataSource,
    ): TableDataSourceConfig => ({
      config: getTableConfig(ds),
      dataSource: getLinkedDataSource(ds, vuuLink, parentDataSource),
      title,
    });

    const getLinkedConfigs = (
      linkedTableConfig: LinkedTableConfig | LinkedTableConfig[],
      parentDataSource?: DataSource,
    ): TableDataSourceConfig | TableDataSourceConfig[] => {
      if (Array.isArray(linkedTableConfig)) {
        return linkedTableConfig.map((config) =>
          getLinkedConfig(config, parentDataSource),
        );
      } else {
        return getLinkedConfig(linkedTableConfig, parentDataSource);
      }
    };

    const { "1": level1, "2": level2, "3": level3 } = linkedDataSources;

    const configLevel1 = getRootConfig(level1);
    const configLevel2 = getLinkedConfigs(level2, configLevel1.dataSource);
    const dsLevel2 = Array.isArray(configLevel2)
      ? undefined
      : configLevel2.dataSource;
    const configLevel3 = level3
      ? getLinkedConfigs(level3, dsLevel2)
      : undefined;

    const results: ResolvedTableConfig = {
      "1": configLevel1,
      "2": configLevel2,
      "3": configLevel3,
    };
    setTableConfig(results);
  }, [VuuDataSource, getServerAPI, linkedDataSources]);

  const handleTabChangeLevel1 = useCallback((tabIndex: number) => {
    setActiveTab(([, v2, v3]) => [tabIndex, v2, v3]);
  }, []);
  const handleTabChangeLevel2 = useCallback((tabIndex: number) => {
    setActiveTab(([v1, , v3]) => [v1, tabIndex, v3]);
  }, []);
  const handleTabChangeLevel3 = useCallback((tabIndex: number) => {
    setActiveTab(([v1, v2]) => [v1, v2, tabIndex]);
  }, []);

  const handleCollapseLevel2 = useCallback(() => {
    setCollapsed(([, val]) => [true, val]);
  }, []);
  const handleExpandLevel2 = useCallback(() => {
    setCollapsed(([, val]) => [false, val]);
  }, []);
  const handleCollapseLevel3 = useCallback(() => {
    setCollapsed(([val]) => [val, true]);
  }, []);
  const handleExpandLevel3 = useCallback(() => {
    setCollapsed(([val]) => [val, false]);
  }, []);

  return {
    activeTabs,
    level1: {
      key: "level1",
      onTabChange: handleTabChangeLevel1,
    },
    level2: {
      collapsed: collapsed[0],
      key: "level2",
      onCollapse: handleCollapseLevel2,
      onExpand: handleExpandLevel2,
      onTabChange: handleTabChangeLevel2,
    },
    level3: {
      collapsed: collapsed[1],
      key: "level3",
      onCollapse: handleCollapseLevel3,
      onExpand: handleExpandLevel3,
      onTabChange: handleTabChangeLevel3,
    },
    tableConfig,
  };
};

export type LevelsConfig = {
  level1: LevelConfig;
  level2: LevelConfig;
  level3: LevelConfig;
};

export type LevelConfig = {
  key: string;
  collapsed?: boolean;
  onCollapse?: () => void;
  onTabChange?: (tabIndex: number) => void;
  onExpand?: () => void;
};
