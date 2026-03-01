import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes, ReactNode } from "react";
import {
  DatasourceStatsHookProps,
  useDatasourceStats,
} from "./useDatasourceStats";

import dataSourceStats from "./DatasourceStats.css";

export type ItemLabel =
  | string
  | {
      singlular: string;
      plural: string;
    };

export interface DataSourceStatsProps
  extends DatasourceStatsHookProps,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * children will be displayed when selection present. Intended
   * use case is display of action button(s) that will operate on
   * selected rows.
   */
  children?: ReactNode;
  selectionActions?: ReactNode;
  tooltrayActions?: ReactNode;
}

const classBase = "vuuDatasourceStats";

const numberFormatter = new Intl.NumberFormat();

export const DataSourceStats = ({
  children,
  className,
  dataSource,
  showRowStats = true,
  tooltrayActions,
  ...htmlAttributes
}: DataSourceStatsProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-datasource-stats",
    css: dataSourceStats,
    window: targetWindow,
  });

  const { range, selectedCount, size } = useDatasourceStats({
    dataSource,
    showRowStats,
  });

  const from = numberFormatter.format(range.from + 1);
  const to = numberFormatter.format(Math.min(range.to, size));
  const value = numberFormatter.format(size);

  if (size === 0) {
    return (
      <div {...htmlAttributes} className={cx(classBase, className)}>
        <span className={`${classBase}-label`}>No Rows to display</span>
      </div>
    );
  } else {
    return (
      <div
        {...htmlAttributes}
        className={cx(classBase, className, {
          [`${classBase}-withSelection`]: selectedCount > 0,
        })}
      >
        {showRowStats ? (
          <div className={`${classBase}-statsPanel ${classBase}-rowStats`}>
            <span className={`${classBase}-label`}>Row count</span>
            <span className={`${classBase}-range`}>
              <span className={`${classBase}-value`}>{from}</span>
              <span className={`${classBase}-label`}>-</span>
              <span className={`${classBase}-value`}>{to}</span>
            </span>
            <span className={`${classBase}-label`}>of</span>
            <span className={`${classBase}-value`}>{value}</span>
            {selectedCount > 0 ? (
              <span
                className={cx(`${classBase}-label`, `${classBase}-selected`)}
              >{`${selectedCount.toLocaleString()} selected`}</span>
            ) : null}
          </div>
        ) : null}
        {selectedCount > 0 ? (
          <div
            className={`${classBase}-statsPanel ${classBase}-selectionActions`}
          >
            {children}
          </div>
        ) : null}
        {tooltrayActions ? (
          <div className={`${classBase}-statsPanel ${classBase}-tooltray`}>
            <span className={`${classBase}-actions`}>{tooltrayActions}</span>
          </div>
        ) : null}
      </div>
    );
  }
};
