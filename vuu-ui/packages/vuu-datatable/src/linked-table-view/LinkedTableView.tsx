import { DataSource, DataSourceConstructorProps } from "@finos/vuu-data-types";
import { Flexbox, Stack, View } from "@finos/vuu-layout";
import { VuuLink } from "@finos/vuu-protocol-types";
import { Table } from "@finos/vuu-table";
import { TableConfig } from "@finos/vuu-table-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import {
  LevelConfig,
  LevelsConfig,
  type TableDataSourceConfig,
  useLinkedTableView,
} from "./useLinkedTableView";

import css from "./LinkedTableView.css";

const classBase = "vuuLinkedTableView";

export interface LinkTableConfig {
  config?: TableConfig;
  dataSource: DataSourceConstructorProps | DataSource;
  title: string;
}
export interface LinkedTableConfig extends LinkTableConfig {
  /**
   * toTable will default to the table above in hierarchy. If there are multiple
   * tables in level above, toTable should be specified.
   */
  vuuLink: Pick<VuuLink, "fromColumn" | "toColumn"> & { toTable?: string };
}

/**
 * Currently supports max of three levels of hierarchical data
 * 1 = parent (required)
 * 2 = child (required)
 * 3 = grandchild (optional)
 */
export type LinkedDataSources = {
  "1": LinkTableConfig;
  "2": LinkedTableConfig | LinkedTableConfig[];
  "3"?: LinkedTableConfig | LinkedTableConfig[];
};

/**
 * Displays a vertical 'tower' of Tables with a hierarchical relationship.
 * Selection of row(s) on tables higher in the hierarchy drives the population
 * of data in tables below. (could be two-way ?)
 */
export interface LinkedTableViewProps extends HTMLAttributes<HTMLDivElement> {
  linkedDataSources: LinkedDataSources;
}
const LinkedTables = ({
  className,
  linkedDataSources,
  ...htmlAttributes
}: LinkedTableViewProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-linked-table-view",
    css: css,
    window: targetWindow,
  });

  const { activeTabs, tableConfig, ...config } = useLinkedTableView({
    linkedDataSources,
  });

  const getLinkedTables = (
    tdsConfig: TableDataSourceConfig | TableDataSourceConfig[],
    { onTabChange, ...levelConfig }: LevelConfig,
  ) =>
    Array.isArray(tdsConfig) ? (
      <Stack
        active={activeTabs[1]}
        data-resizeable
        key={levelConfig.key}
        onTabSelectionChanged={onTabChange}
        style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
      >
        {tdsConfig.map(({ config, dataSource, title }, i) => (
          <View
            className={`${classBase}-view`}
            key={i}
            resizeable
            style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
            title={title}
          >
            <Table config={config} dataSource={dataSource} />
          </View>
        ))}
      </Stack>
    ) : (
      <View
        {...levelConfig}
        header
        resizeable
        style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
        title={tdsConfig.title}
      >
        <Table config={tdsConfig.config} dataSource={tdsConfig.dataSource} />
      </View>
    );

  const getAllLinkedTables = (
    level2: TableDataSourceConfig | TableDataSourceConfig[],
    level3: TableDataSourceConfig | TableDataSourceConfig[] | undefined,
    config: LevelsConfig,
  ) => {
    const results = [getLinkedTables(level2, config.level2)];
    if (level3) {
      results.push(getLinkedTables(level3, config.level3));
    }
    return results;
  };

  if (tableConfig) {
    const { "1": level1, "2": level2, "3": level3 } = tableConfig;
    return (
      <div {...htmlAttributes} className={cx(classBase, className)}>
        <Flexbox style={{ flexDirection: "column", height: "100%" }}>
          <View
            className={`${classBase}-view`}
            header
            resizeable
            style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
            title={level1.title}
          >
            <Table config={level1.config} dataSource={level1.dataSource} />
          </View>
          {...getAllLinkedTables(level2, level3, config)}
        </Flexbox>
      </div>
    );
  } else {
    return null;
  }
};

// Wrap the core component in View so we have access to View Context services
export const LinkedTableView = ({
  className,
  linkedDataSources,
  ...htmlAttributes
}: LinkedTableViewProps) => (
  <View {...htmlAttributes} className={className}>
    <LinkedTables linkedDataSources={linkedDataSources} />
  </View>
);
