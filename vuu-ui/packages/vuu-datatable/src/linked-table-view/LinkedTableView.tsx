import { DataSource, DataSourceConstructorProps } from "@finos/vuu-data-types";
import { Flexbox, View } from "@finos/vuu-layout";
import { VuuTable } from "@finos/vuu-protocol-types";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes } from "react";
import { useLinkedTableView } from "./useLinkedTableView";
import { Table } from "@finos/vuu-table";

import css from "./LinkedTableView.css";

const classBase = "vuuLinkedTableView";

export type LinkedDataSource = {
  dataSource: DataSourceConstructorProps | DataSource;
  linkColumns: { fromColumn: string; toColumn: string; toTable?: VuuTable };
};

/**
 * Currently supports max of three levels of hierarchical data
 * 1 = parent (required)
 * 2 = child (required)
 * 3 = grandchild (optional)
 */
export type LinkedDataSources = {
  "1": DataSourceConstructorProps | DataSource;
  "2": LinkedDataSource | LinkedDataSource[];
  "3"?: LinkedDataSource | LinkedDataSource[];
};

/**
 * Displays a vertical 'tower' of Tables with a hierarchical relationship.
 * Selection of row(s) on tables higher in the hierarchy drives the population
 * of data in tables below. (could be two-way ?)
 */
export interface LinkedTableViewProps extends HTMLAttributes<HTMLDivElement> {
  linkedDataSources: LinkedDataSources;
}
export const LinkedTableView = ({
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

  const { linkedTableConfig } = useLinkedTableView({ linkedDataSources });
  console.log({ linkedTableConfig });

  if (linkedTableConfig) {
    const {
      "1": { config: cfg1, dataSource: ds1 },
      "2": linkedTables2,
    } = linkedTableConfig;
    return (
      <div {...htmlAttributes} className={cx(classBase, className)}>
        <Flexbox style={{ flexDirection: "column", height: "100%" }}>
          <View
            className={`${classBase}-view`}
            resizeable
            style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
          >
            <Table config={cfg1} dataSource={ds1} />
          </View>
          {linkedTables2.length === 1 ? (
            <View style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}>
              <Table
                config={linkedTables2[0].config}
                dataSource={linkedTables2[0].dataSource}
              />
            </View>
          ) : (
            <View
              className={`${classBase}-view`}
              resizeable
              style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1 }}
            >
              <Table
                config={linkedTables2[0].config}
                dataSource={linkedTables2[0].dataSource}
              />
            </View>
          )}
        </Flexbox>
      </div>
    );
  } else {
    return null;
  }
};
