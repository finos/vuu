import { DataSource, DataSourceConstructorProps } from "@vuu-ui/vuu-data-types";
import { Flexbox, Stack, View } from "@vuu-ui/vuu-layout";
import { VuuLink } from "@vuu-ui/vuu-protocol-types";
import { Table } from "@vuu-ui/vuu-table";
import { TableConfig } from "@vuu-ui/vuu-table-types";
import { Tabstrip, Tab } from "@vuu-ui/vuu-ui-controls";
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
import { TableLayoutToggleButton } from "./TableLayoutToggleButton";
import { Filter } from "@vuu-ui/vuu-filter-types";

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
 * Currently supported levels are:
 * - tier 1  - parent table(s)
 * - tier 2  - child table(s)
 * -tier 3 (optional) - grandchild table(s)
 *
 * Selection of row(s) on tables higher in the hierarchy drives the display
 * of data in tables below. Currently this is one-way, top-down only
 */
export interface LinkedTableViewProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Optional filter to allow externally controlled filter to be applied. This will
   * be applied to tier 1 table(s).
   * If applicable, it will also be applied to tier2/tier3 table(s) when no selection
   * is in effect from parent table, 'If applicable' means if the filter column is
   * available on tier 2/tier 3 tables).
   * If a filter is provided and it cannot be applied - because
   * column name of filter is not available in tier 1 table, an exception will be thrown.
   */
  filter?: Filter;
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

  const { tableConfig, ...config } = useLinkedTableView({
    linkedDataSources,
  });

  const getLinkedTables = (
    tdsConfig: TableDataSourceConfig | TableDataSourceConfig[],
    {
      activeTab,
      onChangeTabbedView,
      onTabChange,
      tabbedView,
      ...levelConfig
    }: LevelConfig,
  ) =>
    Array.isArray(tdsConfig) === false ? (
      <View
        {...levelConfig}
        header
        resizeable
        style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
        title={tdsConfig.title}
      >
        <Table config={tdsConfig.config} dataSource={tdsConfig.dataSource} />
      </View>
    ) : tabbedView === 1 ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <div className={`${classBase}-header`}>
          <Tabstrip activeTabIndex={activeTab} onActiveChange={onTabChange}>
            {tdsConfig.map(({ title }, i) => (
              <Tab key={i} label={title} />
            ))}
          </Tabstrip>
          <div className={`${classBase}-toolTray`}>
            <TableLayoutToggleButton
              onChange={onChangeTabbedView}
              value={tabbedView}
            />
          </div>
        </div>
        <Stack
          active={activeTab}
          data-resizeable
          key={levelConfig.key}
          showTabs={false}
          style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
        >
          {tdsConfig.map(({ config, dataSource, title }, i) => (
            <div
              className={`${classBase}-view`}
              key={i}
              style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
              title={title}
            >
              <Table config={config} dataSource={dataSource} />
            </div>
          ))}
        </Stack>
      </div>
    ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexBasis: 0,
          flexGrow: 1,
          flexShrink: 1,
        }}
      >
        <div className={`${classBase}-header`}>
          <div className={`${classBase}-flexHeaders`}>
            {tdsConfig.map(({ title }, i) => (
              <span key={i}>{title}</span>
            ))}
          </div>
          <div className={`${classBase}-toolTray`}>
            <TableLayoutToggleButton
              onChange={onChangeTabbedView}
              value={tabbedView}
            />
          </div>
        </div>
        <Flexbox
          style={{
            flexDirection: "row",
            flexBasis: 0,
            flexGrow: 1,
            flexShrink: 1,
          }}
        >
          {tdsConfig.map(({ config, dataSource, title }, i) => (
            <div
              className={`${classBase}-view`}
              data-resizeable
              key={i}
              style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
              title={title}
            >
              <Table config={config} dataSource={dataSource} />
            </div>
          ))}
        </Flexbox>
      </div>
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
